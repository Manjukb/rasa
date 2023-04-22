import { ErrorModel, ResponseViewModel } from '../viewmodels/response-viewmodel';
import {
    PaginatedResponseModel,
    ProductParameterResponse,
    RequestUserResponse,
    SuccessResponse,
} from '../viewmodels/response';

import { ParameterConfiguration } from '../types/parameter-configuration';
import { ProductParameterResponseTransformer } from '../transformer';
import { getRepository } from 'typeorm';

import { inject, injectable } from 'inversify';
import { ProductParameter } from '../database/models/product-parameter';
import { ProductParameterRequest, PageRequest, ProductRequest } from '../viewmodels/requests';
import { ProductServiceContract } from './product-service';
import { Constant, Util } from '../helpers';
import { ProductResponseTransformer } from '../transformer/product-response-transformer';
import { Negotiation } from '../database/models';
import { BusinessType, SessionStatus } from '../enum';
import { CategoryServiceContract } from './category-service';
import { BotServiceContract } from './bot-service';

export interface ProductParameterServiceContract {
    getParameters(user: RequestUserResponse): Promise<ResponseViewModel<ProductParameterResponse[]>>;
    getParametersV2(
        user: RequestUserResponse,
        pageRequest: PageRequest,
    ): Promise<ResponseViewModel<PaginatedResponseModel<ProductParameterResponse>>>;
    getProductParameters(
        organisationId: string,
        productId: string,
    ): Promise<ResponseViewModel<ParameterConfiguration[]>>;
    bulkUpdate(
        organisationId: string,
        parameterRequest: ProductParameterRequest[],
    ): Promise<ResponseViewModel<SuccessResponse>>;
    updateParams(parameterRequest: ProductParameterRequest): Promise<ResponseViewModel<SuccessResponse>>;
    deleteParameter(productId: string, organisationId: string): Promise<ResponseViewModel<SuccessResponse>>;
    updateProductCategory(
        request: any[],
        organisation_id: string,
        businessType: string,
        tenant_id?: string,
    ): Promise<ResponseViewModel<SuccessResponse>>;
}
@injectable()
export class ProductParameterService implements ProductParameterServiceContract {
    public constructor(
        @inject('ProductService') private readonly productService: ProductServiceContract,
        @inject('CategoryService') private readonly categoryService: CategoryServiceContract,
        @inject('BotService') private readonly botService: BotServiceContract,
    ) {}

    private async createOrUpdate(request: ProductParameter) {
        let pr = await getRepository(ProductParameter).findOne({ where: { product_id: request.product_id } });
        if (!pr) {
            pr = new ProductParameter();
            pr.id = Util.newId();
        }
        // we delete the id since it should ideally be either from db or new
        delete request.id;
        pr = Object.assign(pr, request);
        await getRepository(ProductParameter).save(pr);
    }

    public async getParameters(user: RequestUserResponse): Promise<ResponseViewModel<ProductParameterResponse[]>> {
        const response = new ResponseViewModel<ProductParameterResponse[]>();
        const products = ResponseViewModel.getData(await this.productService.getProducts(user), []);
        const productResponses = products.map((p) => ProductResponseTransformer.transform(p));
        const productIds = products.map((product) => product.id);

        const parameters =
            (await getRepository(ProductParameter)
                .createQueryBuilder('parameter')
                .where('parameter.organisation_id = :organisationId', { organisationId: user.organisation_id })
                .andWhere('parameter.product_id IN (:...productIds)', { productIds: productIds || [] })
                .orderBy('parameter.created_date', 'DESC')
                .getMany()) || [];

        response.data = ProductParameterResponseTransformer.transformList(parameters, productResponses);

        return response;
    }

    public async getParametersV2(
        user: RequestUserResponse,
        pageRequest: PageRequest,
    ): Promise<ResponseViewModel<PaginatedResponseModel<ProductParameterResponse>>> {
        const paginatedProducts = ResponseViewModel.getData(
            await this.productService.getProductsWithPagination(user, pageRequest),
            null,
        );

        const botParametersResponse = await this.botService.getOrganisationBots(user.organisation_id);

        if (!paginatedProducts || !paginatedProducts.data.length) {
            const noResultPaginator = new PaginatedResponseModel<ProductParameterResponse>([], 0, 1);
            return ResponseViewModel.with<PaginatedResponseModel<ProductParameterResponse>>(noResultPaginator);
        }

        const products = paginatedProducts.data;
        const productIds = products.map((product) => product.id);

        const parameters =
            (await getRepository(ProductParameter)
                .createQueryBuilder('parameter')
                .where('parameter.organisation_id = :organisationId', { organisationId: user.organisation_id })
                .andWhere('parameter.product_id IN (:...productIds)', {
                    productIds: productIds.length ? productIds : '',
                })
                .orderBy('parameter.created_date', 'DESC')
                .getMany()) || [];
        const data = ProductParameterResponseTransformer.transformList(
            parameters,
            products,
            botParametersResponse.data,
        );

        const resultPaginator = new PaginatedResponseModel<ProductParameterResponse>(
            data,
            paginatedProducts.total,
            paginatedProducts.page_index,
        );

        return ResponseViewModel.with<PaginatedResponseModel<ProductParameterResponse>>(resultPaginator);
    }

    public async getProductParameters(
        organisationId: string,
        productId: string,
    ): Promise<ResponseViewModel<ParameterConfiguration[]>> {
        const response = new ResponseViewModel<ParameterConfiguration[]>();
        const parameters = await getRepository(ProductParameter)
            .createQueryBuilder('parameter')
            .where('parameter.organisation_id = :organisationId', { organisationId })
            .andWhere('parameter.product_id = :productId', { productId })
            .getOne();

        if (!parameters) {
            response.errors.push(new ErrorModel('invalid product_code or organisation_id'));

            return response;
        }

        response.data = parameters.parameter;

        return response;
    }

    public async bulkUpdate(
        organisationId: string,
        parameterRequest: ProductParameterRequest[],
    ): Promise<ResponseViewModel<SuccessResponse>> {
        for (let index = 0; index < parameterRequest.length; index++) {
            const pr = parameterRequest[index];
            if (pr.product.product_code !== Constant.SampleProductCode) {
                const response = await this.productService.createOrUpdate(pr.product, organisationId, true);
                const { data } = response;
                pr.product.id = data.id;
                await this.createOrUpdate(ProductParameterRequest.toModel(pr));
            }
        }
        return new ResponseViewModel<SuccessResponse>();
    }

    public async updateParams(parameterRequest: ProductParameterRequest): Promise<ResponseViewModel<SuccessResponse>> {
        await this.createOrUpdate(ProductParameterRequest.toModel(parameterRequest));
        return new ResponseViewModel<SuccessResponse>();
    }

    public async deleteParameter(
        productId: string,
        organisationId: string,
    ): Promise<ResponseViewModel<SuccessResponse>> {
        const ongoingNegotiationStatus = [SessionStatus.init, SessionStatus.in_progress, SessionStatus.open];
        const negotiation = await getRepository(Negotiation)
            .createQueryBuilder('nego')
            .where('nego.product_id = :productId', { productId })
            .andWhere('nego.status in (:...status)', { status: ongoingNegotiationStatus })
            .getMany();

        if (negotiation.length > 0) {
            return ResponseViewModel.withError(
                'A transaction is ongoing for this product and so you cannot delete this product parameter.',
            );
        }
        (await getRepository(ProductParameter).delete({
            product_id: productId,
            organisation_id: organisationId,
        })) && (await this.productService.delete(productId));

        return ResponseViewModel.withSuccess(true);
    }

    public async updateProductCategory(
        productListRequest: any[],
        organisationId: string,
        businessType: string,
        tenantId?: string,
    ): Promise<ResponseViewModel<SuccessResponse>> {
        if (businessType === BusinessType.sales && tenantId) {
            // Sales-Logic
            // transform the request body into required ProductParameterRequest
            const requestList = productListRequest.map((request: any) => {
                const productParameterRequest = new ProductParameterRequest();
                productParameterRequest.organisation_id = organisationId;
                productParameterRequest.product = new ProductRequest();
                const params = {
                    parameter: [
                        {
                            inverse: false,
                            name: 'price',
                            min: request.price,
                            max: 0,
                            weight: 0,
                            step: '',
                            unit: request.currency,
                        },
                        {
                            inverse: false,
                            name: 'quantity',
                            min: request.quantity,
                            max: 0,
                            weight: 0,
                            step: '',
                            unit: request.uom,
                        },
                    ],
                };
                productParameterRequest.parameter = params.parameter;
                const { category, subcategory, name } = request;
                productParameterRequest.product.name = name;
                productParameterRequest.product.price = request.price;
                productParameterRequest.product.quantity = request.quantity;
                productParameterRequest.product.product_info = { category, subcategory, name };
                productParameterRequest.product.product_code = request.product_code;
                productParameterRequest.product.uom = request.uom;
                productParameterRequest.product.currency = request.currency;
                tenantId && (productParameterRequest.product.tenant_id = tenantId);
                return productParameterRequest;
            });
            await this.bulkUpdate(organisationId, requestList);
        } else {
            // Procurement-Logic
            // transform the request body into required ProductRequest
            const categorySet = await this.categoryService.getCategorySet(organisationId);
            const requestList = productListRequest.map((r) => {
                return ProductRequest.productRowToModel(r, categorySet, organisationId);
            });
            await Promise.all(
                requestList.map(async (r: ProductRequest) => {
                    if (!r.category_id || !r.sub_category_id) {
                        const categoryRequest = {
                            category: r.product_info.category,
                            subCategory: r.product_info.subcategory,
                            organisationId: organisationId,
                        };
                        const categoryResponse = (await this.categoryService.getByNameAndOrganisation(categoryRequest))
                            .data;
                        r.category_id = categoryResponse.parent_id;
                        r.sub_category_id = categoryResponse.id;
                    }
                }),
            );

            await this.productService.importProduct(requestList);
        }

        return ResponseViewModel.withSuccess();
    }
}
