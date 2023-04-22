import { Controller, interfaces, Post, Get, Put } from 'inversify-restify-utils';

import { ControllerBase } from './controller-base';
import { injectable, inject } from 'inversify';
import {
    AuthMiddleware,
    CheckRoleMiddleware,
    TrimMiddleware,
    WithUserRequest,
    ResponseViewModel,
    Roles,
    SuccessResponse,
    parseCsv,
    Util,
    SupplierImportValidator,
    SupplierAddUpdateValidator,
    SupplierImportRow,
    SupplierImportRequest,
    AddUpdateSupplierRequest,
    SupplierServiceContract,
    Constant,
    OrganisationSupplierResponse,
    PaginatedResponseModel,
    PaginatorRequest,
    SupplierOrganisationResponse,
} from '@negobot/shared/';
import * as neatCsv from 'neat-csv';
import { Request, Response } from 'restify';

@Controller('/supplier', AuthMiddleware)
@injectable()
export class SupplierController extends ControllerBase implements interfaces.Controller {
    public constructor(@inject('SupplierService') private readonly supplierService: SupplierServiceContract) {
        super();
    }

    @Post('/import-supplier', TrimMiddleware, CheckRoleMiddleware([Roles.enterprise_admin]))
    public async upload(request: WithUserRequest): Promise<ResponseViewModel<SuccessResponse>> {
        const { organisation_id: organisationId, user_id: userId } = request.user;
        if (!request.files) {
            return ResponseViewModel.withError('Please upload the input file');
        }
        const results = await parseCsv(request.files.file.path);
        if (results.length === 0) {
            return ResponseViewModel.withError('Please add at least one row');
        }

        const transformedResults = results.map((row) => this.transformRow(row));
        const validators = await Promise.all(
            transformedResults.map(async (row, i) => {
                const prodValidator = await Util.runValidation(row, SupplierImportValidator, i);
                return [prodValidator];
            }),
        );
        const errors = [].concat(...validators).filter((v) => v !== true);

        if (errors.length > 0) {
            return ResponseViewModel.withErrors(errors);
        }
        const requests = this.transformIntoRequest(transformedResults, organisationId, userId);

        return this.supplierService.bulkCreateUpdate(requests, organisationId);
    }

    private transformIntoRequest(transformedResults: SupplierImportRow[], organisationId: string, userId: string) {
        return transformedResults.map((r) => {
            return SupplierImportRequest.toRequest(r, userId, organisationId);
        });
    }

    private transformRow(row: neatCsv.Row): SupplierImportRow {
        const transformedRow = {
            id: '',
            company_name: '',
            company_address: '',
            supplier_name: '',
            supplier_email: '',
            supplier_phone: '',
        };
        const requiredParams = Object.keys(transformedRow);

        const entries = Object.entries(row);
        entries.forEach(([key, value]) => {
            const trimmedKey = key.trim();
            if (requiredParams.includes(trimmedKey)) {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                transformedRow[trimmedKey] = value.trim();
            }
        });

        return transformedRow;
    }

    @Post('/sample-file', CheckRoleMiddleware([Roles.enterprise_admin, Roles.enterprise_user]))
    public exportSampleFile(_: Request, response: Response): Response {
        const headers = Constant.supplierCSVFields;
        const sampleData = Constant.supplierCSVSampleValues;
        const csv = Util.transformToCSV(headers, [sampleData]);
        response.sendRaw(200, csv);

        return response;
    }

    @Put('/add-update', CheckRoleMiddleware([Roles.enterprise_admin]))
    public async addSupplier(request: WithUserRequest): Promise<ResponseViewModel<SuccessResponse>> {
        const { organisation_id: organisationId, user_id: userId } = request.user;
        const validationResults = await Util.runValidation(request.body, SupplierAddUpdateValidator);
        const errors = [].concat(...[validationResults]).filter((v) => v !== true);
        if (errors.length > 0) {
            return ResponseViewModel.withErrors([].concat(...errors));
        }
        let supplierRequest = super.transform<AddUpdateSupplierRequest>(request, AddUpdateSupplierRequest);
        supplierRequest = AddUpdateSupplierRequest.toRequest(supplierRequest, userId, organisationId);

        return this.supplierService.createUpdate(supplierRequest, request.user.organisation_id);
    }

    @Get(
        '/',
        AuthMiddleware,
        TrimMiddleware,
        CheckRoleMiddleware([Roles.super_admin, Roles.enterprise_admin, Roles.saas_admin]),
    )
    public async getByCategory(request: WithUserRequest): Promise<ResponseViewModel<OrganisationSupplierResponse[]>> {
        const { category_id: categoryId } = request.query;
        return this.supplierService.get(request.user.organisation_id, categoryId);
    }

    @Get('/all')
    public async getOrganisationSupplier(
        request: WithUserRequest,
    ): Promise<ResponseViewModel<PaginatedResponseModel<OrganisationSupplierResponse>>> {
        const { organisation_id } = request.user;
        const searchRequest = super.withOutAuthTransform<PaginatorRequest>(request, PaginatorRequest, true);

        return await this.supplierService.getAll(organisation_id, searchRequest);
    }

    @Get('/get-all-byOrg')
    public async getSuppliersByOrganisation(request: WithUserRequest): Promise<ResponseViewModel<any>> {
        const { organisation_id } = request.user;
        return await this.supplierService.getSuppliersByOrganisation(organisation_id);
    }

    @Get('/organisations', CheckRoleMiddleware([Roles.supplier]))
    public async getSupplierOrganisations(
        request: WithUserRequest,
    ): Promise<ResponseViewModel<SupplierOrganisationResponse[]>> {
        const { user } = request;

        return this.supplierService.getSupplierOrganisations(user.user_id);
    }
}
