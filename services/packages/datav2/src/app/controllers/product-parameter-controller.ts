import { Controller, Delete, Get, interfaces, Post, Put } from 'inversify-restify-utils';

import {
    AuthMiddleware,
    CheckRoleMiddleware,
    CheckBusinessTypeMiddleware,
    ProductParameterResponse,
    ProductParameterServiceContract,
    Roles,
    SuccessResponse,
    TrimMiddleware,
    WithUserRequest,
    parseCsv,
    productValidator,
    parameterValidator,
    ProductParameterRequest,
    ProductRequest,
    Util,
    PaginatedResponseModel,
    PageRequest,
    Constant,
    SettingServiceContract,
    BusinessType,
    CategoryServiceContract,
    ProductServiceContract,
    ProcurementCreateProductValidator,
    ProductRow,
    CategorySet,
    ProcurementUpdateProductValidator,
    AddUpdateProductRequest,
    ProductResponse,
    LightweightProductResponse,
    IdRequiredValidator,
} from '@negobot/shared/';
import { ControllerBase } from './controller-base';
import { ResponseViewModel } from '@negobot/shared/';
import { inject, injectable } from 'inversify';
import * as neatCsv from 'neat-csv';
import { Response } from 'restify';

type deleteRequest = {
    id: string;
};

type activateRequest = {
    id: string;
};

@Controller('/product', AuthMiddleware)
@injectable()
export class ProductParameterController extends ControllerBase implements interfaces.Controller {
    public constructor(
        @inject('ProductParameterService') private readonly productParamService: ProductParameterServiceContract,
        @inject('SettingService') private readonly settingService: SettingServiceContract,
        @inject('CategoryService') private readonly categoryService: CategoryServiceContract,
        @inject('ProductService') private readonly productService: ProductServiceContract,
    ) {
        super();
    }

    @Get('/parameters', TrimMiddleware, CheckRoleMiddleware([Roles.enterprise_admin, Roles.tenant_admin]))
    public async getParameters(request: WithUserRequest): Promise<ResponseViewModel<ProductParameterResponse[]>> {
        const { user } = request;

        return this.productParamService.getParameters(user);
    }

    @Get('/parameters-v2', TrimMiddleware, CheckRoleMiddleware([Roles.enterprise_admin, Roles.tenant_admin]))
    public async getParametersV2(
        request: WithUserRequest,
    ): Promise<ResponseViewModel<PaginatedResponseModel<ProductParameterResponse | ProductResponse>>> {
        const { user } = request;
        const pageRequest = super.withOutAuthTransform<PageRequest>(request, PageRequest, true);
        const businessType = user.business_types[0];

        if (businessType === BusinessType.procurement) {
            return this.productService.getProductsWithPagination(request.user, pageRequest);
        }

        return this.productParamService.getParametersV2(user, pageRequest);
    }

    @Delete('/parameters', TrimMiddleware, CheckRoleMiddleware([Roles.enterprise_admin, Roles.tenant_admin]))
    public async deleteParameter(request: WithUserRequest): Promise<ResponseViewModel<SuccessResponse>> {
        const businessType = request.user.business_types[0];
        if (businessType === BusinessType.procurement) {
            return await this.productService.delete(((request.body as unknown) as deleteRequest).id);
        }

        return await this.productParamService.deleteParameter(
            (request.query as any).product_id,
            request.user.organisation_id,
        );
    }

    @Post('/activate', TrimMiddleware, CheckRoleMiddleware([Roles.enterprise_admin]))
    public async activate(request: WithUserRequest): Promise<ResponseViewModel<SuccessResponse | null> | null> {
        const businessType = request.user.business_types[0];
        if (businessType === BusinessType.procurement) {
            const validationResult = await super.validate<SuccessResponse>(request, IdRequiredValidator);
            if (validationResult) {
                return validationResult;
            }

            return await this.productService.activate(((request.body as unknown) as activateRequest).id);
        }
        // for sales need to be implemented
        return ResponseViewModel.withSuccess();
    }

    @Get('/', TrimMiddleware, CheckRoleMiddleware([Roles.enterprise_admin, Roles.tenant_admin]))
    public async getProducts(): Promise<ResponseViewModel<unknown[]>> {
        const data = new ResponseViewModel<unknown[]>();
        data.data = [];
        return data;
    }

    @Put('/parameters', TrimMiddleware, CheckRoleMiddleware([Roles.enterprise_admin, Roles.tenant_admin]))
    public async updateParameter(request: WithUserRequest): Promise<ResponseViewModel<SuccessResponse>> {
        const { user } = request;
        const businessType = request.user.business_types[0];

        if (businessType === BusinessType.procurement) {
            const validationResults = await Util.runValidation(request.body, ProcurementUpdateProductValidator);
            const errors = [].concat(...[validationResults]).filter((v) => v !== true);
            if (errors.length > 0) {
                return ResponseViewModel.withErrors([].concat(...errors));
            }
            const updateRequest = super.transform<AddUpdateProductRequest>(request, AddUpdateProductRequest);

            return this.productService.update(updateRequest);
        }

        const updateRequest = super.cast<ProductRow>(request.body);
        const requiredParams = await this.settingService.getProductParameter(user.organisation_id);
        const parameterUpdateRequest = this.transformIntoRequest([updateRequest], user.organisation_id, requiredParams);
        await this.productService.updateManualNegoStatus(updateRequest.product_id, updateRequest.is_manual_nego);
        return await this.productParamService.updateParams(parameterUpdateRequest[0]);
    }

    /*
    Rough Csv format
code,name,category,subcategory,price#min,price#max,price#weight,price#step,price#unit,price#inverse,quantity#min,quantity#max,quantity#weight,quantity#step,quantity#unit,quantity#inverse,monthly_quantity#min,monthly_quantity#max,monthly_quantity#weight,monthly_quantity#step,monthly_quantity#unit,monthly_quantity#inverse
    */
    @Post('/parameters/upload', TrimMiddleware, CheckRoleMiddleware([Roles.enterprise_admin, Roles.tenant_admin]))
    public async upload(request: WithUserRequest): Promise<ResponseViewModel<SuccessResponse>> {
        const { organisation_id: organisationId, tenant_id: tenantId } = request.user;
        if (!request.files) {
            return ResponseViewModel.withError('Please upload the input file');
        }
        const results = await parseCsv(request.files.file.path);
        if (results.length === 0) {
            return ResponseViewModel.withError('Please add at least one row');
        }

        const businessType = request.user.business_types[0];
        if (businessType === BusinessType.procurement) {
            // add code for procurement import
            const transformedResults = results.map((row) => this.transformRow(row));
            const validators = await Promise.all(
                transformedResults.map(async (row, i) => {
                    const prodValidator = await Util.runValidation(row, ProcurementCreateProductValidator, i + 1);
                    return [prodValidator];
                }),
            );

            const errors = [].concat(...validators).filter((v) => v !== true);
            if (errors.length > 0) {
                return ResponseViewModel.withErrors(errors);
            }

            const categorySet = await this.categoryService.getCategorySet(organisationId);
            const res = new ResponseViewModel<SuccessResponse>();
            transformedResults.forEach((r, i: number) => {
                // check category is valid
                const cat = categorySet[r.category.toLowerCase()];
                if (!cat) {
                    res.errors.push({ message: `Row #${i + 1} Category is not correct`, property: 'category' });
                } else {
                    const subcategory = r.subcategory.toLowerCase();
                    if (subcategory) {
                        const subCategoryDetails = cat.find((c) => c.child_name.toLowerCase() === subcategory);
                        if (!subCategoryDetails) {
                            res.errors.push({
                                message: `Row #${i + 1} Sub-Category is not correct`,
                                property: 'sub-category',
                            });
                        }
                    }
                }
            });
            if (ResponseViewModel.hasErrorsStrict(res)) {
                return res;
            }

            return this.productService.importProduct(
                this.transformIntoProcurementRequest(transformedResults, categorySet, organisationId),
            );
        }

        const requiredParams = await this.settingService.getProductParameter(organisationId);

        // break all #s into objects
        const transformedResults = results.map((row) => this.transformRow(row));
        const validators = await Promise.all(
            transformedResults.map(async (row, i) => {
                const prodValidator = await Util.runValidation(row, productValidator, i);
                // now we check if we have required params
                const paramsLengthValidator = await new Promise((resolve) => {
                    Object.keys(row.params).length !== requiredParams.length
                        ? resolve(`Row#${i} required parameters missing`)
                        : resolve(true);
                });
                const paramsValidators = await Promise.all(
                    requiredParams.map((rp) => {
                        const param = row.params[rp];
                        if (!param) {
                            return new Promise((resolve) => resolve(`Row#${i} ${rp} is required`));
                        }
                        // validate individual param
                        return Util.runValidation(param, parameterValidator, i);
                    }),
                );
                return [prodValidator, paramsLengthValidator, ...paramsValidators];
            }),
        );
        const errors = [].concat(...validators).filter((v) => v !== true);
        if (errors.length > 0) {
            return ResponseViewModel.withErrors(errors);
        }
        return await this.productParamService.bulkUpdate(
            request.user.organisation_id,
            this.transformIntoRequest(transformedResults, organisationId, requiredParams, tenantId),
        );
    }

    public transformIntoProcurementRequest(
        transformedResults: ProductRow[],
        categorySet: CategorySet,
        organisationId: string,
    ): ProductRequest[] {
        return transformedResults.map((r) => {
            return ProductRequest.productRowToModel(r, categorySet, organisationId);
        });
    }

    private transformIntoRequest(
        transformedResults: ProductRow[],
        organisationId: string,
        requiredParams: string[],
        tenantId?: string,
    ): ProductParameterRequest[] {
        return transformedResults.map((r) => {
            const paramRequest = new ProductParameterRequest();
            paramRequest.organisation_id = organisationId;
            paramRequest.product = new ProductRequest();
            paramRequest.parameter = [];
            paramRequest.saving_parameters = r.saving_parameters;
            paramRequest.step_count = r.step_count;
            requiredParams.forEach((rp, index) => {
                if (!r.params[rp as keyof ProductRow]) {
                    paramRequest.parameter.push(r.params[index]);
                    return;
                }
                r.params[rp as keyof ProductRow].name = rp;
                paramRequest.parameter.push(r.params[rp as keyof ProductRow]);
            });
            const { category, subcategory, name } = r;
            paramRequest.product.product_info = { category, subcategory, name };
            paramRequest.product.product_code = r.code;
            paramRequest.product.price = paramRequest.parameter.find((p) => p.name === 'price').max;
            paramRequest.product.quantity = paramRequest.parameter.find((p) => p.name === 'quantity').min;
            paramRequest.product.currency = paramRequest.parameter.find((p) => p.name === 'price').unit;
            paramRequest.product.uom = paramRequest.parameter.find((p) => p.name === 'quantity').unit;
            if (r.product_id) {
                paramRequest.product.id = r.product_id;
            }
            tenantId && (paramRequest.product.tenant_id = tenantId);
            return paramRequest;
        });
    }

    private transformRow(row: neatCsv.Row): ProductRow {
        const transformedRow: ProductRow = {
            saving_parameters: { price: 0, quantity: 0 },
            step_count: { price: 0, quantity: 0 },
            name: '',
            category: '',
            is_manual_nego: false,
            params: {},
        };

        Object.keys(row).forEach((col) => {
            const hasHash = col.indexOf('#');
            if (hasHash > -1) {
                const propName = col.substring(0, hasHash);
                const propValue = col.substring(hasHash + 1);

                if (!(transformedRow as ProductRow).params[propName as keyof ProductRow]) {
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore
                    transformedRow.params[propName] = {};
                }
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                transformedRow.params[propName][propValue] = isNaN(row[col]) ? row[col] : +row[col];
            } else {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                transformedRow[col] = row[col];
            }
        });
        return transformedRow;
    }

    @Post('/export-sample-file', CheckRoleMiddleware([Roles.enterprise_admin, Roles.tenant_admin]))
    public exportSampleFile(request: WithUserRequest, response: Response): Response {
        const businessType = request.user.business_types[0];
        if (businessType === BusinessType.procurement) {
            const headers = Constant.productCSVFields;
            const sampleData = Constant.productCSVSampleValue;
            const csv = Util.transformToCSV(headers, [sampleData]);
            response.sendRaw(200, csv);

            return response;
        }

        const headers = Constant.productParameterCSVFields;
        const sampleData = Constant.productParameterCSVSampleValue;
        const csv = Util.transformToCSV(headers, [sampleData]);
        response.sendRaw(200, csv);

        return response;
    }

    @Get('/:id', CheckRoleMiddleware([Roles.enterprise_admin, Roles.enterprise_user]))
    public async getById(request: WithUserRequest): Promise<ResponseViewModel<ProductResponse>> {
        const id = request.params && request.params.id ? request.params.id : '';
        return this.productService.getById(id);
    }

    @Get(
        '/lightweight-list',
        CheckRoleMiddleware([Roles.enterprise_admin, Roles.enterprise_user]),
        CheckBusinessTypeMiddleware([BusinessType.procurement]),
    )
    public async lightweightProductList(
        request: WithUserRequest,
    ): Promise<ResponseViewModel<LightweightProductResponse[]>> {
        const organisationId = request.user.organisation_id;
        const categoryId = request.query && request.query.category_id ? request.query.category_id : '';
        return this.productService.getLightweightProductList(organisationId, categoryId);
    }
}
