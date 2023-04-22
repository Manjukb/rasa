import { Constant, Util } from '../helpers';
import { ErrorModel, ResponseViewModel } from '../viewmodels/response-viewmodel';
import {
    LightweightProductResponse,
    PaginatedResponseModel,
    ProductResponse,
    RequestUserResponse,
    SuccessResponse,
} from '../viewmodels/response';

import { PageRequest, AddUpdateProductRequest } from '../viewmodels/requests';
import { Product, ProductParameter } from '../database/models';
import { ProductRequest } from '../viewmodels/requests/product-request';
import { ProductResponseTransformer } from '../transformer/product-response-transformer';
import { getRepository } from 'typeorm';
import { injectable, inject } from 'inversify';
import { CategoryServiceContract } from './category-service';

export interface ProductServiceContract {
    createOrUpdate(
        request: ProductRequest,
        organisationId: string,
        isUpdate?: boolean,
    ): Promise<ResponseViewModel<Product>>;
    getMany(productIds: Iterable<string>, organisationId: string): Promise<ResponseViewModel<Product[]>>;
    getByproductCode(
        productCode: string,
        organisationId: string,
        tenantId?: string,
    ): Promise<ResponseViewModel<ProductResponse>>;
    getProducts(user: RequestUserResponse): Promise<ResponseViewModel<Product[]>>;
    getProductsWithPagination(
        user: RequestUserResponse,
        pageRequest: PageRequest,
    ): Promise<ResponseViewModel<PaginatedResponseModel<ProductResponse>>>;

    importProduct(request: ProductRequest[]): Promise<ResponseViewModel<SuccessResponse>>;
    delete(id: string): Promise<ResponseViewModel<SuccessResponse>>;
    activate(id: string): Promise<ResponseViewModel<SuccessResponse>>;
    updateManualNegoStatus(id: string, is_manual_nego: boolean): Promise<ResponseViewModel<SuccessResponse>>;
    create(
        ProductRequest: AddUpdateProductRequest,
        user: RequestUserResponse,
    ): Promise<ResponseViewModel<SuccessResponse>>;
    update(updateRequest: AddUpdateProductRequest): Promise<ResponseViewModel<SuccessResponse>>;
    getById(id: string): Promise<ResponseViewModel<ProductResponse>>;
    getLightweightProductList(
        organisationId: string,
        categoryId: string,
    ): Promise<ResponseViewModel<LightweightProductResponse[]>>;
    getLightweightProductListOrganisationId(
        organisationId: string,
    ): Promise<ResponseViewModel<LightweightProductResponse[]>>;
    getProductCountsByProductIds(ids: string[], organisationId: string): Promise<number>;
    getByCategory(categoryId: string): Promise<ResponseViewModel<ProductResponse[]>>;

    getLightweightByProductIds(productIds: string[]): Promise<LightweightProductResponse[]>;
}
@injectable()
export class ProductService implements ProductServiceContract {
    public constructor(@inject('CategoryService') private readonly categoryService: CategoryServiceContract) {}

    private async store(product: Product): Promise<void> {
        await getRepository(Product).save(product);
    }

    private async getByCode(
        product_code: string,
        organisation_id: string,
        tenant_id?: string,
        productId?: string,
    ): Promise<Product> {
        const query = getRepository(Product)
            .createQueryBuilder('product')
            .where('product.product_code = :product_code', { product_code })
            .andWhere('product.organisation_id = :organisation_id', { organisation_id });

        if (tenant_id) {
            query.andWhere('product.tenant_id = :tenant_id', { tenant_id });
        }
        if (productId) {
            query.andWhere('product.id = :productId', { productId });
        }

        const product = await query.getOne();

        return product;
    }

    public async getMany(productIds: Iterable<string>, organisationId: string): Promise<ResponseViewModel<Product[]>> {
        let products: Product[] = [];
        const response = new ResponseViewModel<Product[]>();
        if (!productIds) {
            response.data = products;
            return;
        }
        const uniqueIds = [...new Set(productIds)];
        products = await getRepository(Product).findByIds(uniqueIds, { where: { organisation_id: organisationId } });
        response.data = products;

        return response;
    }

    public async getByproductCode(
        productCode: string,
        organisationId: string,
        tenantId?: string,
    ): Promise<ResponseViewModel<ProductResponse>> {
        const response = new ResponseViewModel<ProductResponse>();
        const query = getRepository(Product)
            .createQueryBuilder('pr')
            .where('pr.product_code = :productCode', { productCode })
            .andWhere('pr.organisation_id = :organisationId', { organisationId });
        if (tenantId) {
            query.andWhere('pr.tenant_id = :tenantId', { tenantId });
        }

        const product = await query.getOne();

        if (!product) {
            response.errors.push(new ErrorModel('Invalid product code'));

            return response;
        }
        const productParameter = await getRepository(ProductParameter).findOne({ where: { product_id: product.id } });
        if (!productParameter) {
            response.errors.push(new ErrorModel('Invalid Product Parameter'));
            return response;
        }
        response.data = ProductResponseTransformer.transform(product, productParameter);

        return response;
    }

    public async getProducts(user: RequestUserResponse): Promise<ResponseViewModel<Product[]>> {
        const response = new ResponseViewModel<Product[]>();
        const query = getRepository(Product)
            .createQueryBuilder('pr')
            .where('pr.organisation_id = :orgId', { orgId: user.organisation_id });
        if (user.tenant_id) {
            query.andWhere('pr.tenant_id = :tenantId', { tenantId: user.tenant_id });
        }
        const products = await query.getMany();
        response.data = products;

        return response;
    }

    public async getProductsWithPagination(
        user: RequestUserResponse,
        pageRequest: PageRequest,
    ): Promise<ResponseViewModel<PaginatedResponseModel<ProductResponse>>> {
        const page = pageRequest.page && +pageRequest.page > 1 ? +pageRequest.page : 1;
        const query = getRepository(Product)
            .createQueryBuilder('pr')
            .innerJoinAndSelect('pr.category', 'category')
            .where('pr.organisation_id = :orgId', { orgId: user.organisation_id })
            .andWhere('pr.is_active = :status', { status: true });
        if (user.tenant_id) {
            query.andWhere('pr.tenant_id = :tenantId', { tenantId: user.tenant_id });
        }

        const [products, totalItems] = await query
            .skip((page - 1) * Constant.pageSize)
            .take(Constant.pageSize)
            .orderBy('pr.updated_date', 'DESC')
            .getManyAndCount();

        const productResponses = products.map((p) => ProductResponseTransformer.transform(p));

        const paginatedData = new PaginatedResponseModel<ProductResponse>(productResponses, totalItems, page);

        return ResponseViewModel.with<PaginatedResponseModel<ProductResponse>>(paginatedData);
    }

    public async createOrUpdate(
        request: ProductRequest,
        organisationId: string,
        isUpdate?: boolean,
    ): Promise<ResponseViewModel<Product>> {
        const response = new ResponseViewModel<Product>();
        const categoryRequest = {
            category: request.product_info.category,
            subCategory: request.product_info.subcategory,
            organisationId: organisationId,
            tenantId: request.tenant_id,
        };
        const categoryResponse = (await this.categoryService.getByNameAndOrganisation(categoryRequest)).data;
        let product: any = {};
        if (isUpdate) {
            product = await this.getByCode(request.product_code, organisationId, request.tenant_id, request.id);
        } else {
            product = await this.getByCode(request.product_code, organisationId, request.tenant_id);
        }

        if (!product) {
            product = new Product();
            product.id = Util.newId();
        }
        delete request.id;
        request.organisation_id = organisationId;

        const productModel = ProductRequest.toModel(request);
        productModel.name = request.product_info.name;
        productModel.category_id = categoryResponse.parent_id;
        productModel.sub_category_id = categoryResponse.id;
        product.product_info = Object.keys(productModel.product_info).length
            ? productModel.product_info
            : product.product_info;
        delete productModel.product_info;
        const newProduct = Object.assign(product, productModel);

        await this.store(newProduct);
        response.data = newProduct;

        return response;
    }

    public async importProduct(request: ProductRequest[]): Promise<ResponseViewModel<SuccessResponse>> {
        const requestModels = request.map((r) => ProductRequest.toModel(r));
        await Promise.all(requestModels.map((m) => this.save(m)));

        return ResponseViewModel.withSuccess();
    }

    private async save(product: Product): Promise<void> {
        if (!product.id) {
            product.id = Util.guid();
        } else {
            product.updated_date = new Date();
        }
        let dbProduct: Product;
        if (product.product_code) {
            dbProduct = await getRepository(Product).findOne({ product_code: product.product_code });
        }
        if (!dbProduct) {
            const query = getRepository(Product)
                .createQueryBuilder('prd')
                .where('prd.organisation_id = :organisationId', { organisationId: product.organisation_id });
            product.name && query.andWhere('prd.name = :name', { name: product.name });
            product.category_id && query.andWhere('prd.category_id = :categoryId', { categoryId: product.category_id });
            product.sub_category_id &&
                query.andWhere('prd.sub_category_id = :subCategoryId', { subCategoryId: product.sub_category_id });

            dbProduct = await query.getOne();
        }
        !product.product_code && (product.product_code = null);
        !product.category_id && (product.category_id = null);
        !product.sub_category_id && (product.sub_category_id = null);

        if (dbProduct) {
            delete product.id;
            await getRepository(Product).update(dbProduct.id, product);
            return;
        }

        await getRepository(Product).save(product);
    }

    public async activate(id: string): Promise<ResponseViewModel<SuccessResponse>> {
        const product = await getRepository(Product).findOne(id);
        if (!product) {
            return ResponseViewModel.withErrorModels([new ErrorModel('invalid product-id', 'id')]);
        }

        product.is_active = true;
        product.updated_date = new Date();
        await getRepository(Product).update(id, product);

        return ResponseViewModel.withSuccess();
    }

    public async updateManualNegoStatus(
        id: string,
        is_manual_nego: boolean,
    ): Promise<ResponseViewModel<SuccessResponse>> {
        const product = await getRepository(Product).findOne(id);
        if (!product) {
            return ResponseViewModel.withErrorModels([new ErrorModel('invalid product-id', 'id')]);
        }

        product.is_manual_nego = is_manual_nego;
        product.updated_date = new Date();
        await getRepository(Product).update(id, product);

        return ResponseViewModel.withSuccess();
    }

    public async delete(id: string): Promise<ResponseViewModel<SuccessResponse>> {
        const product = await getRepository(Product).findOne(id);
        if (!product) {
            return ResponseViewModel.withErrorModels([new ErrorModel('invalid product-id', 'id')]);
        }

        product.is_active = false;
        product.updated_date = new Date();
        await getRepository(Product).update(id, product);

        return ResponseViewModel.withSuccess();
    }

    public async create(
        productRequest: AddUpdateProductRequest,
        user: RequestUserResponse,
    ): Promise<ResponseViewModel<SuccessResponse>> {
        const product = new Product();
        const categoryResponse = await this.categoryService.getById(productRequest.category_id);
        if (ResponseViewModel.hasErrors(categoryResponse)) {
            return ResponseViewModel.withErrorModels(categoryResponse.errors);
        }
        const allProductNamesByCategory = ((await this.getByCategory(productRequest.category_id)).data || []).map(
            (product) => product.name,
        );
        const hasProductAlreadyCreated = (allProductNamesByCategory || []).some(
            (product) => product.toLowerCase() === productRequest.name.toLowerCase(),
        );
        if (hasProductAlreadyCreated) {
            return ResponseViewModel.withError('Product has already been created');
        }
        product.id = Util.guid();
        product.organisation_id = user.organisation_id;
        product.name = productRequest.name;
        product.category_id = productRequest.category_id;
        product.product_code = productRequest.product_code;
        product.description = {
            description_1: productRequest.description_1,
            description_2: productRequest.description_2,
        };

        product.product_info = {
            name: productRequest.name,
            category: categoryResponse.data.name,
        };
        product.is_active = productRequest.is_active;
        product.uom = productRequest.uom;
        product.price = productRequest.price ?? 0;
        product.currency = productRequest.currency;

        if (productRequest.sub_category_id) {
            const subCategoryResponse = await this.categoryService.getById(productRequest.sub_category_id);
            if (ResponseViewModel.hasErrors(subCategoryResponse)) {
                return ResponseViewModel.withError('subcategory is not under the given category');
            }

            if (subCategoryResponse.data.parent_id !== product.category_id) {
                return ResponseViewModel.withError('invalid sub-category');
            }

            product.product_info = { ...product.product_info, subcategory: subCategoryResponse.data.name };
            product.sub_category_id = productRequest.sub_category_id;
        }

        product.created_date = new Date();
        product.updated_date = new Date();
        await getRepository(Product).save(product);

        return ResponseViewModel.withSuccess();
    }

    public async update(updateRequest: AddUpdateProductRequest): Promise<ResponseViewModel<SuccessResponse>> {
        const id = updateRequest.id;
        const product = await getRepository(Product).findOne(id);
        if (!product) {
            return ResponseViewModel.withErrorModels([new ErrorModel('invalid product id', 'id')]);
        }
        product.is_manual_nego;
        const categoryResponse = await this.categoryService.getById(updateRequest.category_id);
        if (ResponseViewModel.hasErrors(categoryResponse)) {
            return ResponseViewModel.withErrorModels(categoryResponse.errors);
        }
        product.name = updateRequest.name;
        product.is_manual_nego = updateRequest.is_manual_nego;

        product.category_id = updateRequest.category_id;
        product.product_code = updateRequest.product_code;
        product.description = {
            description_1: updateRequest.description_1,
            description_2: updateRequest.description_2,
        };

        product.product_info = {
            ...product.product_info,
            category: categoryResponse.data.name,
            name: updateRequest.name,
        };
        product.is_active = updateRequest.is_active;
        product.uom = updateRequest.uom;
        product.price = updateRequest.price ?? 0;
        product.currency = updateRequest.currency;

        if (updateRequest.sub_category_id) {
            const subCategoryResponse = await this.categoryService.getById(updateRequest.sub_category_id);
            if (ResponseViewModel.hasErrors(subCategoryResponse)) {
                return ResponseViewModel.withError('subcategory is not under the given category');
            }

            if (subCategoryResponse.data.parent_id !== product.category_id) {
                return ResponseViewModel.withError('invalid sub-category');
            }

            product.product_info = { ...product.product_info, subcategory: subCategoryResponse.data.name };
            product.sub_category_id = updateRequest.sub_category_id;
        }

        product.updated_date = new Date();
        await getRepository(Product).update(id, product);

        return ResponseViewModel.withSuccess();
    }

    public async getById(id: string): Promise<ResponseViewModel<ProductResponse>> {
        const product = await getRepository(Product).findOne(id);
        if (!product) {
            return ResponseViewModel.withErrorModels([new ErrorModel('invalid product id', 'id')]);
        }

        const response = ProductResponseTransformer.transform(product);

        return ResponseViewModel.with(response);
    }

    public async getLightweightProductList(
        organisationId: string,
        categoryId: string,
    ): Promise<ResponseViewModel<LightweightProductResponse[]>> {
        const query = getRepository(Product)
            .createQueryBuilder('prd')
            .select(['prd.id', 'prd.name', 'prd.product_info', 'prd.uom', 'prd.price', 'prd.currency'])
            .where('prd.organisation_id = :organisationId', { organisationId });
        categoryId && query.andWhere('prd.category_id = :categoryId', { categoryId });

        const products = await query.andWhere('prd.is_active = true').orderBy('prd.name', 'ASC').getMany();

        return ResponseViewModel.with(LightweightProductResponse.fromModels(products));
    }

    public async getLightweightProductListOrganisationId(
        organisationId: string,
    ): Promise<ResponseViewModel<LightweightProductResponse[]>> {
        const query = getRepository(Product)
            .createQueryBuilder('prd')
            .where('prd.organisation_id = :organisationId', { organisationId });
        const products = await query.andWhere('prd.is_active = true').orderBy('prd.name', 'ASC').getMany();

        return ResponseViewModel.with(LightweightProductResponse.fromModels(products));
    }

    public async getProductCountsByProductIds(ids: string[], organisationId: string): Promise<number> {
        const count = await getRepository(Product)
            .createQueryBuilder('prd')
            .where('prd.organisation_id = :organisationId', { organisationId })
            .andWhere('prd.id IN (:...ids)', { ids: ids.length ? ids : [''] })
            .getCount();

        return count;
    }

    public async getByCategory(categoryId: string): Promise<ResponseViewModel<ProductResponse[]>> {
        const products = await getRepository(Product).find({ category_id: categoryId });
        const response = ProductResponseTransformer.transformList(products);

        return ResponseViewModel.with(response);
    }

    public async getLightweightByProductIds(ids: string[]): Promise<LightweightProductResponse[]> {
        const products = await getRepository(Product)
            .createQueryBuilder('prd')
            .andWhere('prd.id IN (:...ids)', { ids: ids.length ? ids : [''] })
            .getMany();

        return LightweightProductResponse.fromModels(products);
    }
}
