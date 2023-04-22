import { ErrorModel, ResponseViewModel } from '../viewmodels/response-viewmodel';
import { injectable, inject } from 'inversify';

import { AddUpdateSupplierRequest, SupplierImportRequest } from '../viewmodels/requests';
import {
    SuccessResponse,
    OrganisationSupplierResponse,
    PaginatedResponseModel,
    SupplierOrganisationResponse,
} from '../viewmodels/response';
import { Supplier, SupplierUser } from '../database/models';
import { getRepository } from 'typeorm';
import { PaginatorRequest, Util } from '..';
import {
    OrganisationServiceContract,
    SupplierCategoryProductServiceContract,
    SupplierOrganisationServiceContract,
    SupplierUserServiceContract,
    UserServiceContract,
    ProductServiceContract,
    CategoryServiceContract,
    SupplierCompanyServiceContract,
} from '.';

export interface SupplierServiceContract {
    bulkCreateUpdate(
        requests: SupplierImportRequest[],
        organisationId: string,
    ): Promise<ResponseViewModel<SuccessResponse>>;
    createUpdate(
        request: AddUpdateSupplierRequest,
        organisationId: string,
    ): Promise<ResponseViewModel<SuccessResponse>>;
    get(organisationId: string, categoryId: string): Promise<ResponseViewModel<OrganisationSupplierResponse[]>>;
    getAll(
        organisationId: string,
        searchRequest: PaginatorRequest,
    ): Promise<ResponseViewModel<PaginatedResponseModel<OrganisationSupplierResponse>>>;
    getSuppliersByOrganisation(organisationId: string): Promise<ResponseViewModel<any>>;
    getLightweightBySupplierIds(ids: string[]): Promise<Supplier[]>;

    getSupplierOrganisations(userId: string): Promise<ResponseViewModel<SupplierOrganisationResponse[]>>;
}

@injectable()
export class SupplierService implements SupplierServiceContract {
    public constructor(
        @inject('SupplierUserService') private readonly supplierUserService: SupplierUserServiceContract,
        @inject('SupplierOrganisationService')
        private readonly supplierOrganisationService: SupplierOrganisationServiceContract,
        @inject('UserService') private readonly userService: UserServiceContract,
        @inject('OrganisationService') private readonly organisationService: OrganisationServiceContract,
        @inject('ProductService') private readonly productService: ProductServiceContract,
        @inject('CategoryService') private readonly categoryService: CategoryServiceContract,
        @inject('SupplierCategoryProductService')
        private readonly supplierCategoryProductService: SupplierCategoryProductServiceContract,
        @inject('SupplierCompanyService')
        private readonly supplierCompanyService: SupplierCompanyServiceContract,
    ) {}

    public async getOrCreate(
        request: SupplierImportRequest | AddUpdateSupplierRequest,
        supplierCompanyId: string,
    ): Promise<ResponseViewModel<Supplier>> {
        const response = new ResponseViewModel<Supplier>();
        const userAlreadyExist = (await this.userService.getByEmail(request.email)).data;
        const supplier =
            userAlreadyExist &&
            (await getRepository(Supplier)
                .createQueryBuilder('supplier')
                .where('supplier.id = :supplierId', { supplierId: userAlreadyExist.supplier_id })
                .getOne());
        if (request.id.trim() !== '') {
            response.data = supplier;
            return response;
        }
        if (userAlreadyExist && supplier) {
            response.errors.push(new ErrorModel('This supplier user already exists.'));
            return response;
        }

        const transformedRequest = {
            id: Util.guid(),
            supplier_company_id: supplierCompanyId,
        };
        response.data = await getRepository(Supplier).save(transformedRequest);

        return response;
    }

    public async bulkCreateUpdate(
        requests: SupplierImportRequest[],
        organisationId: string,
    ): Promise<ResponseViewModel<SuccessResponse>> {
        for (let i = 0; i < requests.length; i++) {
            // for loop will wait for promise to resolve
            const data = requests[i];
            const response = await this.createSupplier(data, organisationId);
            if (response.errors.length > 0) {
                return ResponseViewModel.withErrors(response.errors.map((e) => `${data.email} -> ${e.message}`));
            }
        }

        return ResponseViewModel.withSuccess();
    }

    public async createUpdate(
        request: AddUpdateSupplierRequest,
        organisationId: string,
    ): Promise<ResponseViewModel<SuccessResponse>> {
        const response = await this.createSupplier(request, organisationId);
        if (response.data) {
            return ResponseViewModel.withSuccess();
        }
        return ResponseViewModel.withErrors(response.errors.map((e) => e.message));
    }

    private async createSupplier(data: any, organisationId: string): Promise<ResponseViewModel<SuccessResponse>> {
        const supplierCompany = await this.supplierCompanyService.getOrCreate(data);
        const supplier = await this.getOrCreate(data, supplierCompany.id);
        if (supplier.data) {
            const supplierUser = await this.supplierUserService.getOrCreateSupplierUser(data, supplier.data);
            await this.supplierOrganisationService.getOrCreate(supplier.data.id, organisationId);
            await this.supplierUserService.saveSupplierUserMapping(supplier.data, supplierUser);
            await this.supplierCategoryProductService.getOrCreate(supplier.data.id, data);
            return ResponseViewModel.withSuccess();
        }
        return ResponseViewModel.withErrors(supplier.errors.map((e) => e.message));
    }

    public async getByIds(supplierIds: string[], categoryId?: string): Promise<ResponseViewModel<Supplier[]>> {
        const query = getRepository(Supplier)
            .createQueryBuilder('supplier')
            .where('id in (:...supplierIds)', {
                supplierIds: supplierIds.length ? supplierIds : [''],
            });

        if (categoryId) {
            query.andWhere(`supplier.category_ids @> :categoryId or supplier.category_ids is null`, {
                categoryId: JSON.stringify([categoryId]),
            });
        }

        const suppliers = await query.getMany();
        const supplierCompanies =
            suppliers &&
            (await this.supplierCompanyService.getBySupplierCompanyIds(
                (suppliers || []).map((s) => s.supplier_company_id),
            ));
        suppliers &&
            suppliers.forEach((supplier) => {
                const supplierCompany = supplierCompanies.find((s) => s.id === supplier.supplier_company_id);
                supplier.name = supplierCompany.name;
                supplier.address = supplierCompany.address;
            });
        return ResponseViewModel.with(suppliers);
    }

    private async getOrganisationSuppliers(suppliers: Supplier[]): Promise<OrganisationSupplierResponse[]> {
        const supplierIds = suppliers.map((supplier) => supplier.id);
        const supplierUsers = await this.supplierUserService.getSuppliersUsers(supplierIds);
        const supplierUsersIds = supplierUsers.map((supplierUser) => supplierUser.user_id);

        const indexedSupplierUsers: { [key: string]: string[] } = {};
        supplierUsers.forEach((supplierUser: SupplierUser): void => {
            if (!indexedSupplierUsers[supplierUser.supplier_id]) {
                indexedSupplierUsers[supplierUser.supplier_id] = [];
            }
            const data = indexedSupplierUsers[supplierUser.supplier_id];
            if (!data.includes(supplierUser.user_id)) {
                indexedSupplierUsers[supplierUser.supplier_id].push(supplierUser.user_id);
            }
        });

        const users = await this.userService.getByIds(supplierUsersIds);
        const data = suppliers.map((supplier: Supplier) => {
            const filteredUserIds = indexedSupplierUsers[supplier.id] || [];

            const filteredSupplierUsers = users.filter((user) => filteredUserIds.includes(user.user_id));

            return OrganisationSupplierResponse.fromModel(supplier, filteredSupplierUsers);
        });

        return data;
    }

    public async get(
        organisationId: string,
        categoryId?: string,
    ): Promise<ResponseViewModel<OrganisationSupplierResponse[]>> {
        const supplierIds = (await this.supplierOrganisationService.organisationSupplierIds(organisationId)).data;
        const suppliers = (await this.getByIds(supplierIds, categoryId)).data;
        const data = await this.getOrganisationSuppliers(suppliers);

        return ResponseViewModel.with(data);
    }

    public async getAll(
        organisationId: string,
        paginatorRequest: PaginatorRequest,
    ): Promise<ResponseViewModel<PaginatedResponseModel<OrganisationSupplierResponse>>> {
        const page = +(paginatorRequest.page || 1) > 0 ? +(paginatorRequest.page || 1) : 1;

        const { supplierOrganisations, count } = await this.supplierOrganisationService.getAll(
            organisationId,
            paginatorRequest,
        );
        const supplierIds = supplierOrganisations.map((sg) => sg.supplier_id);

        const suppliers = (await this.getByIds(supplierIds)).data;
        const data = await this.getOrganisationSuppliers(suppliers);

        const paginatedData = new PaginatedResponseModel<OrganisationSupplierResponse>(data, count, page);

        return ResponseViewModel.with(paginatedData);
    }

    public async getSuppliersByOrganisation(organisationId: string): Promise<ResponseViewModel<any>> {
        const suppliersByOrganisationId =
            organisationId && (await this.supplierOrganisationService.getSupplierOrganisationByOrgId(organisationId));

        const organisationSupplierIds: string[] = (suppliersByOrganisationId || []).map((so) => so.supplier_id);
        const suppliers = await this.getLightweightBySupplierIds(organisationSupplierIds);
        const supplierCategoryProducts = await this.supplierCategoryProductService.getSupplierCategoryProductBySupplierIds(
            organisationSupplierIds,
        );

        const supplierUserInfo = suppliers && (await this.userService.getBySupplierIds(organisationSupplierIds));

        const supplierProductIds: string[] = supplierCategoryProducts
            .map((e) => e.product_ids)
            .reduce((acc, val) => acc.concat(val), []);
        const productIds = [...new Set((supplierProductIds || []).map((item) => item))];

        const categories = suppliers && (await this.categoryService.getList(organisationId)).data;
        const products =
            suppliers && (await this.productService.getLightweightByProductIds(productIds ? productIds : ['']));

        const orgSuppliers = supplierCategoryProducts.map((scp) => {
            const supplier = suppliers.find((s) => s.id === scp.supplier_id);
            const userInfo = (supplierUserInfo || []).find((u) => u.supplier_id === scp.supplier_id);
            const category = (categories || []).find((c) => (scp.category_ids || []).includes(c.id));
            const product = (products || []).filter((p) => (scp.product_ids || []).includes(p.id));
            return {
                supplier,
                userInfo: userInfo,
                organisation_id: organisationId,
                category_ids: scp.category_ids,
                sub_category_ids: scp.sub_category_ids,
                products_ids: scp.product_ids,
                category: category,
                products: product,
            };
        });

        return ResponseViewModel.with(orgSuppliers);
    }

    public async getLightweightBySupplierIds(ids: string[]): Promise<Supplier[]> {
        const suppliers = await getRepository(Supplier)
            .createQueryBuilder()
            .andWhere('id IN (:...ids)', { ids: ids.length ? ids : [''] })
            .getMany();
        const supplierCompanies =
            suppliers &&
            (await this.supplierCompanyService.getBySupplierCompanyIds(
                (suppliers || []).map((s) => s.supplier_company_id),
            ));
        suppliers &&
            suppliers.forEach((supplier) => {
                const supplierCompany = supplierCompanies.find((s) => s.id === supplier.supplier_company_id);
                supplier.name = supplierCompany.name;
                supplier.address = supplierCompany.address;
            });

        return suppliers;
    }

    public async getSupplierOrganisations(userId: string): Promise<ResponseViewModel<SupplierOrganisationResponse[]>> {
        const supplierIds = await this.supplierUserService.getSuppliersIdsByUserId(userId);
        const supplierOrganisationsIds = await this.supplierOrganisationService.getOrganisationIdsBySupplierIds(
            supplierIds,
        );
        const orgs = await this.organisationService.getByOrgIds(supplierOrganisationsIds);
        const data = SupplierOrganisationResponse.fromModels(orgs);

        return ResponseViewModel.with(data);
    }
}
