import { Controller, interfaces, Post, Get, Put, Delete } from 'inversify-restify-utils';

import {
    AuthMiddleware,
    CheckRoleMiddleware,
    Roles,
    Util,
    WithUserRequest,
    SuccessResponse,
    ResponseViewModel,
    ProductServiceContract,
    PaginatedResponseModel,
    PageRequest,
    ProductResponse,
    TrimMiddleware,
    CreateProductValidator,
    UpdateProductValidator,
    IdRequiredValidator,
    AddUpdateProductRequest,
    CheckBusinessTypeMiddleware,
    BusinessType,
    LightweightProductResponse,
    // AddUpdateSaasProductRequest,
} from '@negobot/shared/';
import { ControllerBase } from './controller-base';
import { injectable, inject } from 'inversify';

type deleteRequest = {
    id: string;
};
type activateRequest = {
    id: string;
};
@Controller('/products', AuthMiddleware)
@injectable()
export class ProductController extends ControllerBase implements interfaces.Controller {
    public constructor(@inject('ProductService') private readonly productService: ProductServiceContract) {
        super();
    }

    @Get('/', CheckRoleMiddleware([Roles.enterprise_admin, Roles.enterprise_user]))
    public async getAll(request: WithUserRequest): Promise<ResponseViewModel<PaginatedResponseModel<ProductResponse>>> {
        const pageRequest = super.withOutAuthTransform<PageRequest>(request, PageRequest, true);

        return this.productService.getProductsWithPagination(request.user, pageRequest);
    }

    @Get('/all', CheckRoleMiddleware([Roles.enterprise_admin, Roles.enterprise_user]))
    public async all(request: WithUserRequest): Promise<ResponseViewModel<PaginatedResponseModel<ProductResponse>>> {
        const pageRequest = super.withOutAuthTransform<PageRequest>(request, PageRequest, true);

        return this.productService.getProductsWithPagination(request.user, pageRequest);
    }

    @Post('/add', TrimMiddleware, CheckRoleMiddleware([Roles.enterprise_admin, Roles.tenant_admin]))
    public async createProduct(request: WithUserRequest): Promise<ResponseViewModel<SuccessResponse>> {
        const validationResults = await Util.runValidation(request.body, CreateProductValidator);
        const errors = [].concat(...[validationResults]).filter((v) => v !== true);
        if (errors.length > 0) {
            return ResponseViewModel.withErrors([].concat(...errors));
        }
        const productRequest = super.transform<AddUpdateProductRequest>(request, AddUpdateProductRequest);

        return this.productService.create(productRequest, request.user);
    }

    @Put('/update', TrimMiddleware, CheckRoleMiddleware([Roles.enterprise_admin, Roles.tenant_admin]))
    public async updateParameter(request: WithUserRequest): Promise<ResponseViewModel<SuccessResponse>> {
        const validationResults = await Util.runValidation(request.body, UpdateProductValidator);
        const errors = [].concat(...[validationResults]).filter((v) => v !== true);
        if (errors.length > 0) {
            return ResponseViewModel.withErrors([].concat(...errors));
        }
        const updateRequest = super.transform<AddUpdateProductRequest>(request, AddUpdateProductRequest);

        return this.productService.update(updateRequest);
    }

    @Delete('/', TrimMiddleware, CheckRoleMiddleware([Roles.enterprise_admin]))
    public async delete(request: WithUserRequest): Promise<ResponseViewModel<SuccessResponse | null> | null> {
        const validationResult = await super.validate<SuccessResponse>(request, IdRequiredValidator);
        if (validationResult) {
            return validationResult;
        }

        return await this.productService.delete(((request.body as unknown) as deleteRequest).id);
    }

    @Post('/activate', TrimMiddleware, CheckRoleMiddleware([Roles.enterprise_admin]))
    public async activate(request: WithUserRequest): Promise<ResponseViewModel<SuccessResponse | null> | null> {
        const validationResult = await super.validate<SuccessResponse>(request, IdRequiredValidator);
        if (validationResult) {
            return validationResult;
        }

        return await this.productService.activate(((request.body as unknown) as activateRequest).id);
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

    @Get(
        '/list',
        CheckRoleMiddleware([Roles.enterprise_admin, Roles.enterprise_user]),
        CheckBusinessTypeMiddleware([BusinessType.procurement]),
    )
    public async productsByOrganisationId(
        request: WithUserRequest,
    ): Promise<ResponseViewModel<LightweightProductResponse[]>> {
        const organisationId = request.user.organisation_id;
        return this.productService.getLightweightProductListOrganisationId(organisationId);
    }
}
