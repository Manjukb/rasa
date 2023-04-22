import { Category, Rfq, RfqSupplier } from '../database/models';
import { CategoryRequest, CreateSubCategoryRequest, UpdateCategoryRequest } from '../viewmodels/requests';
import {
    CategoryResponse,
    LightweightCategoryResponse,
    PaginatedResponseModel,
    RequestUserResponse,
    SuccessResponse,
} from '../viewmodels/response';
import { Constant, Util } from '../helpers';
import { ErrorModel, ResponseViewModel } from '../viewmodels/response-viewmodel';
import { SelectQueryBuilder, getConnectionManager, getRepository } from 'typeorm';

import { CategorySearchRequest } from '../viewmodels/requests/search';
import { CategorySet } from '../types';
import { RfqStatus } from '../enum/rfq-status';
import { Roles } from '..';
import { injectable } from 'inversify';

export interface CategoryServiceContract {
    bulkCreateUpdate(request: CategoryRequest[]): Promise<ResponseViewModel<SuccessResponse>>;
    createUpdate(request: CategoryRequest): Promise<ResponseViewModel<SuccessResponse>>;
    createSubCategory(request: CreateSubCategoryRequest, userId: string): Promise<ResponseViewModel<SuccessResponse>>;
    getAll(
        searchRequest: CategorySearchRequest,
        organisationId: string,
        user: RequestUserResponse,
        orderBy: CategorySearchRequest,
    ): Promise<ResponseViewModel<PaginatedResponseModel<CategoryResponse>>>;
    getList(organisationId: string): Promise<ResponseViewModel<CategoryResponse[]>>;

    updateCategory(
        updateCategoryRequest: UpdateCategoryRequest,
        organisationId: string,
    ): Promise<ResponseViewModel<SuccessResponse>>;
    delete(id: string): Promise<ResponseViewModel<SuccessResponse>>;
    activate(id: string): Promise<ResponseViewModel<SuccessResponse>>;
    getCategorySet(organisationId: string): Promise<CategorySet>;
    getById(id: string): Promise<ResponseViewModel<Category>>;
    getByNameAndOrganisation(request: any): Promise<ResponseViewModel<Category>>;
    getParentCategoryList(
        organisationId: string,
        tenantId?: string,
    ): Promise<ResponseViewModel<LightweightCategoryResponse[]>>;
    getByIds(categoryIds: string[], ignoreParent?: boolean): Promise<ResponseViewModel<Category[]>>;
}
@injectable()
export class CategoryService implements CategoryServiceContract {
    public async createUpdate(request: CategoryRequest): Promise<ResponseViewModel<SuccessResponse>> {
        await this.createOrUpdate(request);

        return ResponseViewModel.withSuccess();
    }
    public async bulkCreateUpdate(request: CategoryRequest[]): Promise<ResponseViewModel<SuccessResponse>> {
        for (let i = 0; i < request.length; i++) {
            // for loop will wait for promise to resolve
            await this.createOrUpdate(request[i]);
        }

        return ResponseViewModel.withSuccess();
    }

    private async createOrUpdate(request: CategoryRequest): Promise<Category> {
        const { name, organisation_id, sub_category, tenant_id } = request;
        let category = tenant_id
            ? await getRepository(Category).findOne({ name, organisation_id, tenant_id })
            : await getRepository(Category).findOne({ name, organisation_id });

        if (!category) {
            category = new Category();
            category.id = Util.newId();
            category.name = name;
            category.organisation_id = organisation_id;
            category.created_by = request.created_by;
            category.updated_by = request.updated_by;
            category.tenant_id = tenant_id;

            await getRepository(Category).save(category);
        }
        if (!sub_category) {
            return category;
        }

        let subCategory = tenant_id
            ? await getRepository(Category).findOne({
                  name: sub_category,
                  parent_id: category.id,
                  organisation_id,
                  tenant_id,
              })
            : await getRepository(Category).findOne({
                  name: sub_category,
                  parent_id: category.id,
                  organisation_id,
              });

        if (!subCategory) {
            subCategory = new Category();
            subCategory.id = Util.newId();
            subCategory.name = sub_category;
            subCategory.parent_id = category.id;
            subCategory.parent_name = category.name ?? null;
            subCategory.organisation_id = organisation_id;
            subCategory.tenant_id = tenant_id;
            subCategory.created_by = request.created_by;
            subCategory.updated_by = request.updated_by;

            await getRepository(Category).save(subCategory);
        }

        return subCategory;
    }

    private addFilterCondition<T>(
        query: SelectQueryBuilder<T>,
        filterRequest: CategorySearchRequest,
    ): SelectQueryBuilder<T> {
        const isActiveString = filterRequest.active ?? '';
        const name = filterRequest.name ?? '';
        const isActive = isActiveString ? isActiveString.toLowerCase() === 'true' : false;

        if (isActiveString && !isActive) {
            query.andWhere('cat.is_active = false');
        }
        if (isActiveString && isActive) {
            query.andWhere('cat.is_active = true');
        }
        if (!isActiveString) {
            query.andWhere('cat.is_active = true');
        }
        name && query.andWhere('cat.name = :name', { name });

        return query;
    }

    public async getSubCategories(parentIds: string[], removeDisabled = false): Promise<Category[]> {
        const query = getRepository(Category)
            .createQueryBuilder('cat')
            .where('cat.parent_id IN (:...parentIds)', { parentIds: parentIds.length ? parentIds : '' });
        if (removeDisabled) {
            query.andWhere('cat.is_active = true');
        }

        const categories = await query.orderBy('cat.parent_id', 'DESC').getMany();

        return categories;
    }

    public async getAll(
        searchRequest: CategorySearchRequest,
        organisationId: string,
        user: RequestUserResponse,
        orderBy: CategorySearchRequest,
    ): Promise<ResponseViewModel<PaginatedResponseModel<CategoryResponse>>> {
        const page = +(searchRequest.page || 1) > 0 ? +(searchRequest.page || 1) : 1;
        const finalOrganisationId = searchRequest.organisation_id ? searchRequest.organisation_id : organisationId;
        const query = getRepository(Category)
            .createQueryBuilder('cat')
            .where('cat.parent_id is null')
            .andWhere('cat.organisation_id = :organisationId', { organisationId: finalOrganisationId });

        if (user.role === Roles.supplier) {
            const currentDateTime = new Date();
            const rfqIds = (
                await getRepository(RfqSupplier)
                    .createQueryBuilder('rfq_supplier')
                    .select(['rfq_supplier.rfq_id'])
                    .where('rfq_supplier.supplier_id = :supplierId', { supplierId: user.supplier_id })
                    .getRawMany()
            ).map((e) => {
                return e.rfq_supplier_rfq_id;
            });
            const catIdsFromRfq = (
                await getRepository(Rfq)
                    .createQueryBuilder('rfq')
                    .select(['rfq.category_ids'])
                    .where('rfq.id IN (:...ids)', { ids: rfqIds.length ? rfqIds : [''] })
                    .andWhere('rfq.status != :status', { status: RfqStatus.draft })
                    .andWhere('rfq.launch_date <= :current', { current: currentDateTime })
                    .getRawMany()
            ).map((e) => {
                if (e.rfq_category_ids !== null) {
                    return e.rfq_category_ids.toString();
                }
            });
            query.andWhere('cat.id IN (:...ids)', { ids: catIdsFromRfq.length ? catIdsFromRfq : [''] });
        }

        this.addFilterCondition<Category>(query, searchRequest);

        query
            .skip((page - 1) * Constant.pageSize)
            .take(Constant.pageSize)
            .orderBy('cat.updated_date', 'DESC');
        if (orderBy.id && Util.validateUuid(orderBy.id)) {
            query.orderBy(`case when id = '${orderBy.id}' then 1 else 2 end`).addOrderBy('cat.updated_date', 'DESC');
        }

        const [results, totalItems] = await query.getManyAndCount();
        if (!results.length) {
            const paginatedData = new PaginatedResponseModel<CategoryResponse>([], totalItems, page);

            return ResponseViewModel.with<PaginatedResponseModel<CategoryResponse>>(paginatedData);
        }

        const parentIds = results && results.map((r) => r.id);
        const subCategories = await this.getSubCategories(parentIds);
        const data = CategoryResponse.fromModels(results, subCategories);
        const paginatedData = new PaginatedResponseModel<CategoryResponse>(data, totalItems, page);

        return ResponseViewModel.with<PaginatedResponseModel<CategoryResponse>>(paginatedData);
    }

    public async getList(organisationId: string): Promise<ResponseViewModel<CategoryResponse[]>> {
        const query = getRepository(Category)
            .createQueryBuilder('cat')
            .where('cat.parent_id is null')
            .andWhere('cat.organisation_id = :organisationId', { organisationId });

        const [results] = await query.orderBy('cat.name', 'DESC').getManyAndCount();

        const parentIds = results && results.map((r) => r.id);
        const subCategories = await this.getSubCategories(parentIds, true);
        const data = CategoryResponse.fromModels(results, subCategories);

        return ResponseViewModel.with(data);
    }

    public async updateCategory(
        request: UpdateCategoryRequest,
        organisationId: string,
    ): Promise<ResponseViewModel<SuccessResponse>> {
        const { id, name, parent_id: parentId, updated_by: userId, is_active } = request;
        const categoryById = await getRepository(Category)
            .createQueryBuilder('cat')
            .where('cat.id = :id', { id })
            .getOne();
        if (!categoryById) {
            return ResponseViewModel.withErrorModels([new ErrorModel('invalid id', 'id')]);
        }

        if (parentId) {
            const categoryByParentId = await getRepository(Category)
                .createQueryBuilder('cat')
                .where('cat.parent_id = :parentId', { parentId })
                .getOne();
            if (!categoryByParentId) {
                return ResponseViewModel.withErrorModels([new ErrorModel('invalid parent-id', 'parent-id')]);
            }
        }
        if (name && !parentId) {
            const category = await getRepository(Category)
                .createQueryBuilder('cat')
                .where('cat.name = :name', { name })
                .andWhere('cat.parent_id is null')
                .andWhere('cat.organisation_id = :organisationId', { organisationId })
                .getOne();
            if (category && category.id !== id) {
                return ResponseViewModel.withErrorModels([
                    new ErrorModel('Main Category already existing with this name', 'invalid-name'),
                ]);
            }
            categoryById.name = name.trim();
            categoryById.is_active = is_active;
            categoryById.updated_by = userId;
            categoryById.updated_date = new Date();
            if (!is_active) {
                await getRepository(Category).update(
                    { parent_id: id },
                    { is_active, updated_by: userId, updated_date: new Date() },
                );
            }

            return await this.update(id, categoryById);
        }

        const category = await getRepository(Category)
            .createQueryBuilder('cat')
            .where('cat.parent_id = :parentId', { parentId })
            .andWhere('cat.name = :name', { name })
            .andWhere('cat.organisation_id = :organisationId', { organisationId })
            .getOne();
        if (category && category.id !== id) {
            return ResponseViewModel.withErrorModels([
                new ErrorModel('Sub-Category already existing with this name', 'invalid-name'),
            ]);
        }

        categoryById.name = name.trim();
        categoryById.updated_by = userId;
        categoryById.parent_id = parentId;
        categoryById.is_active = is_active;
        categoryById.updated_date = new Date();

        return await this.update(id, categoryById);
    }

    private async update(id: string, category: Category): Promise<ResponseViewModel<SuccessResponse>> {
        category.updated_date = new Date();
        await getRepository(Category).update(id, category);

        return ResponseViewModel.withSuccess();
    }

    public async createSubCategory(
        request: CreateSubCategoryRequest,
        userId: string,
    ): Promise<ResponseViewModel<SuccessResponse>> {
        const { name, parent_id } = request;
        const parentCategory = await getRepository(Category).findOne({ id: parent_id });
        if (!parentCategory) {
            return ResponseViewModel.withErrorModels([new ErrorModel('invalid parent-id', 'parent-id')]);
        }
        const subCategoryWithSameName = await getRepository(Category).findOne({ parent_id, name });
        if (subCategoryWithSameName) {
            return ResponseViewModel.withErrorModels([
                new ErrorModel('Sub-Category already exists with same name', 'parent-id'),
            ]);
        }
        const newCategory = new Category();
        newCategory.id = Util.guid();
        newCategory.name = name;
        newCategory.organisation_id = parentCategory.organisation_id;
        newCategory.created_by = userId;
        newCategory.updated_by = userId;
        newCategory.parent_id = parent_id;

        await getRepository(Category).save(newCategory);

        return ResponseViewModel.withSuccess();
    }

    public async delete(id: string): Promise<ResponseViewModel<SuccessResponse>> {
        const category = await getRepository(Category).findOne(id);
        if (!category) {
            return ResponseViewModel.withErrorModels([new ErrorModel('invalid category-id', 'id')]);
        }

        const subCategories = await getRepository(Category).find({ parent_id: id, is_active: true });
        if (subCategories.length) {
            return ResponseViewModel.withErrorModels([
                new ErrorModel('Category contains some sub-categories, so please deactivate sub-categories first', ''),
            ]);
        }

        category.is_active = false;
        await getRepository(Category).update(id, category);

        return ResponseViewModel.withSuccess();
    }

    public async activate(id: string): Promise<ResponseViewModel<SuccessResponse>> {
        const category = await getRepository(Category).findOne(id);
        if (!category) {
            return ResponseViewModel.withErrorModels([new ErrorModel('invalid category-id', 'id')]);
        }

        // const subCategories = await getRepository(Category).find({ parent_id: id, is_active: false });
        // if (subCategories.length) {
        //     return ResponseViewModel.withErrorModels([
        //         new ErrorModel('Category contains some de-activated sub-categories, so please activate sub-categories first', ''),
        //     ]);
        // }
        category.is_active = true;
        await getRepository(Category).update(id, category);

        return ResponseViewModel.withSuccess();
    }

    public async getCategorySet(organisationId: string): Promise<CategorySet> {
        const categories = await getConnectionManager().get()
            .query(`SELECT c.id, c.name, c.parent_id, cc.id as child_id, cc.name as child_name, cc.parent_id as child_parent_id 
                FROM category C
                LEFT JOIN category cc ON cc.parent_id = c.id
                WHERE c.parent_id IS null AND c.organisation_id = '${organisationId}'`);
        const categorySet: CategorySet = {};

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        categories.forEach((category: any): void => {
            const categoryName = category.name.toLowerCase();
            const element = categorySet[categoryName];
            if (!element) {
                categorySet[categoryName] = [];
            }
            const data = {
                id: category.id,
                name: categoryName,
                child_id: category.child_id,
                child_name: category.child_name ? category.child_name.toLowerCase() : null,
                child_parent_id: category.child_parent_id,
            };
            categorySet[categoryName].push(data);
        });

        return categorySet;
    }

    public async getByIds(categoryIds: string[], ignoreParent = false): Promise<ResponseViewModel<Category[]>> {
        if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
            return ResponseViewModel.with([]);
        }
        const query = getRepository(Category)
            .createQueryBuilder('cat')
            .where('id in (:...categoryIds)', { categoryIds });
        if (!ignoreParent) {
            query.andWhere('parent_id is null');
        }
        const dbCategories = await query.getMany();

        return ResponseViewModel.with(dbCategories);
    }

    public async getById(id: string): Promise<ResponseViewModel<Category>> {
        const category = await getRepository(Category).findOne({ id, is_active: true });
        if (!category) {
            return ResponseViewModel.withError('invalid category-id');
        }

        return ResponseViewModel.with(category);
    }

    public async getByNameAndOrganisation(request: any): Promise<ResponseViewModel<Category>> {
        const category = await this.createOrUpdate(
            CategoryRequest.toRequest(
                request.category,
                request.subCategory,
                request.organisationId,
                null,
                request.tenantId,
            ),
        );
        return ResponseViewModel.with(category);
    }

    public async getParentCategoryList(
        organisationId: string,
        tenantId?: string,
    ): Promise<ResponseViewModel<LightweightCategoryResponse[]>> {
        const query = getRepository(Category)
            .createQueryBuilder('cat')
            .select(['cat.id', 'cat.name'])
            .where('cat.organisation_id = :organisationId', { organisationId });

        if (tenantId) {
            query.andWhere('cat.tenant_id = :tenantId', { tenantId });
        }

        const categories = await query
            .andWhere('cat.is_active = true')
            .andWhere('cat.parent_id is null')
            .orderBy('cat.name', 'ASC')
            .getMany();

        return ResponseViewModel.with(LightweightCategoryResponse.fromModels(categories));
    }
}
