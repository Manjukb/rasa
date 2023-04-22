import { Controller, Get, interfaces, Post, Put, Delete } from 'inversify-restify-utils';

import {
    AuthMiddleware,
    CheckRoleMiddleware,
    Roles,
    SuccessResponse,
    TrimMiddleware,
    WithUserRequest,
    parseCsv,
    Util,
    CategoryValidator,
    CategoryRequest,
    CategoryServiceContract,
    CategoryProductServiceContract,
    Constant,
    CategorySearchRequest,
    CategoryResponse,
    PaginatedResponseModel,
    CreateCategoryViaWebhookValidator,
    UpdateCategoryValidator,
    UpdateCategoryRequest,
    CreateSubCategoryValidator,
    CreateSubCategoryRequest,
    CheckBusinessTypeMiddleware,
    BusinessType,
    LightweightCategoryResponse,
    ProductResponse,
} from '@negobot/shared/';
import { ControllerBase } from './controller-base';
import { ResponseViewModel } from '@negobot/shared/';
import { injectable, inject } from 'inversify';
import { Response, Request } from 'restify';
import * as neatCsv from 'neat-csv';

type categoryRow = {
    category_name: string;
    sub_category_name: string;
};

type deleteRequest = {
    id: string;
};
type activateRequest = {
    id: string;
};
@Controller('/category', AuthMiddleware)
@injectable()
export class CategoryController extends ControllerBase implements interfaces.Controller {
    public constructor(
        @inject('CategoryService') private readonly categoryService: CategoryServiceContract,
        @inject('CategoryProductService') private readonly categoryProductService: CategoryProductServiceContract,
    ) {
        super();
    }

    @Get('/all', TrimMiddleware, CheckRoleMiddleware([Roles.enterprise_admin, Roles.enterprise_user, Roles.supplier]))
    public async getAll(
        request: WithUserRequest,
    ): Promise<ResponseViewModel<PaginatedResponseModel<CategoryResponse>>> {
        const { organisation_id: organisationId } = request.user;
        const searchRequest = super.withOutAuthTransform<CategorySearchRequest>(request, CategorySearchRequest, true);
        if (Roles.supplier === request.user.role && !searchRequest.organisation_id) {
            return ResponseViewModel.withError('For a supplier, please pass organisation_id');
        }
        const { selected } = request.query;
        const orderBy: CategorySearchRequest = {};
        if (selected) {
            orderBy.id = selected;
            // searchRequest.page = 1; // do NOT reset active page to 1
        }
        return this.categoryService.getAll(searchRequest, organisationId, request.user, orderBy);
    }

    @Get('/list', TrimMiddleware, CheckRoleMiddleware([Roles.enterprise_admin, Roles.enterprise_user]))
    public async getList(request: WithUserRequest): Promise<ResponseViewModel<CategoryResponse[]>> {
        const { organisation_id: organisationId } = request.user;

        return this.categoryService.getList(organisationId);
    }

    @Post('/upload', TrimMiddleware, CheckRoleMiddleware([Roles.enterprise_admin]))
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
                const prodValidator = await Util.runValidation(row, CategoryValidator, i);
                return [prodValidator];
            }),
        );
        const errors = [].concat(...validators).filter((v) => v !== true);
        if (errors.length > 0) {
            return ResponseViewModel.withErrors(errors);
        }
        return this.categoryService.bulkCreateUpdate(
            this.transformIntoRequest(transformedResults, organisationId, userId),
        );
    }

    private transformIntoRequest(transformedResults: categoryRow[], organisationId: string, userId: string) {
        return transformedResults.map((r) => {
            const { category_name, sub_category_name: subCategory } = r;
            return CategoryRequest.toRequest(category_name, subCategory, organisationId, userId);
        });
    }

    private transformRow(row: neatCsv.Row): categoryRow {
        const transformedRow: { category_name: string; sub_category_name: string } = {
            category_name: '',
            sub_category_name: '',
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

    @Post('/create-via-webhook', TrimMiddleware, CheckRoleMiddleware([Roles.enterprise_admin]))
    public async create(request: WithUserRequest): Promise<ResponseViewModel<SuccessResponse | null> | null> {
        const validationResult = await super.validate<SuccessResponse>(request, CreateCategoryViaWebhookValidator);
        if (validationResult) {
            return validationResult;
        }
        let categoryRequest = super.withOutAuthTransform<CategoryRequest>(request, CategoryRequest);
        const { name, sub_category: subCategory, created_by: createdBy } = categoryRequest;
        categoryRequest = CategoryRequest.toRequest(name, subCategory, request.user.organisation_id, createdBy);

        return this.categoryService.createUpdate(categoryRequest);
    }

    @Put('/update', TrimMiddleware, CheckRoleMiddleware([Roles.enterprise_admin]))
    public async update(request: WithUserRequest): Promise<ResponseViewModel<SuccessResponse | null> | null> {
        const validationResult = await super.validate<SuccessResponse>(request, UpdateCategoryValidator);
        if (validationResult) {
            return validationResult;
        }
        const updateCategoryRequest = super.transform<UpdateCategoryRequest>(request, UpdateCategoryRequest);

        return this.categoryService.updateCategory(updateCategoryRequest, request.user.organisation_id);
    }

    @Post('/sub-category', TrimMiddleware, CheckRoleMiddleware([Roles.enterprise_admin]))
    public async createSubCategory(
        request: WithUserRequest,
    ): Promise<ResponseViewModel<SuccessResponse | null> | null> {
        const validationResult = await super.validate<SuccessResponse>(request, CreateSubCategoryValidator);
        if (validationResult) {
            return validationResult;
        }
        const categoryRequest = super.withOutAuthTransform<CreateSubCategoryRequest>(request, CreateSubCategoryRequest);

        return this.categoryService.createSubCategory(categoryRequest, request.user.user_id);
    }

    @Delete('/', TrimMiddleware, CheckRoleMiddleware([Roles.enterprise_admin]))
    public async delete(request: WithUserRequest): Promise<ResponseViewModel<SuccessResponse>> {
        return await this.categoryService.delete(((request.body as unknown) as deleteRequest).id);
    }

    @Post('/activate', TrimMiddleware, CheckRoleMiddleware([Roles.enterprise_admin]))
    public async activate(request: WithUserRequest): Promise<ResponseViewModel<SuccessResponse>> {
        return await this.categoryService.activate(((request.body as unknown) as activateRequest).id);
    }

    @Post(
        '/export-sample-file',
        CheckRoleMiddleware([Roles.enterprise_admin]),
        CheckBusinessTypeMiddleware([BusinessType.procurement]),
    )
    public exportSampleFile(_: Request, response: Response): Response {
        const headers = Constant.categoryCSVFields;
        const sampleData = Constant.categoryCSVSampleValue;
        const csv = Util.transformToCSV(headers, [sampleData]);
        response.sendRaw(200, csv);

        return response;
    }

    @Get(
        '/parent-list',
        TrimMiddleware,
        CheckRoleMiddleware([Roles.enterprise_admin, Roles.enterprise_user, Roles.saas_admin, Roles.tenant_admin]),
    )
    public async getParentList(request: WithUserRequest): Promise<ResponseViewModel<LightweightCategoryResponse[]>> {
        const { organisation_id: organisationId, tenant_id: tenantId } = request.user;

        return this.categoryService.getParentCategoryList(organisationId, tenantId);
    }

    @Get('/:id/products', CheckRoleMiddleware([Roles.enterprise_admin, Roles.enterprise_user]))
    public async getById(request: WithUserRequest): Promise<ResponseViewModel<ProductResponse[]>> {
        const id = request.params && request.params.id ? request.params.id : '';
        return this.categoryProductService.getCategoryProducts(id);
    }
}
