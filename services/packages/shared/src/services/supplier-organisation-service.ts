import { injectable, inject } from 'inversify';

import { Supplier, SupplierCategoryProduct, SupplierOrganisation, User } from '../database/models';
import {
    OrganisationSupplierResponse,
    PaginatedResponseModel,
    PaginatorRequest,
    ResponseViewModel,
    SuccessResponse,
} from './..';
import { getRepository } from 'typeorm';
import { Constant, Util } from '../helpers';
import { SupplierCompanyServiceContract, SupplierUserServiceContract, UserServiceContract } from '.';

export interface SupplierOrganisationServiceContract {
    getOrCreate(supplierId: string, organisationId: string): Promise<ResponseViewModel<SuccessResponse>>;
    getOrganisationSupplier(
        organisationId: string,
        paginatorRequest: PaginatorRequest,
        categoryId?: string,
        productIds?: string[],
    ): Promise<ResponseViewModel<PaginatedResponseModel<OrganisationSupplierResponse>>>;
    organisationSupplierIds(organisationId: string): Promise<ResponseViewModel<string[]>>;
    getAll(
        organisationId: string,
        paginatorRequest: PaginatorRequest,
    ): Promise<{ supplierOrganisations: SupplierOrganisation[]; count: number }>;
    getSupplierOrganisationByOrgId(organisationId: string): Promise<SupplierOrganisation[]>;
    getOrganisationIdsBySupplierIds(supplierIds: string[]): Promise<string[]>;
}

@injectable()
export class SupplierOrganisationService implements SupplierOrganisationServiceContract {
    public constructor(
        @inject('UserService') private readonly userService: UserServiceContract,
        @inject('SupplierUserService') private readonly supplierUserService: SupplierUserServiceContract,
        @inject('SupplierCompanyService') private readonly supplierCompanyService: SupplierCompanyServiceContract,
    ) {}
    public async getOrCreate(supplierId: string, organisationId: string): Promise<ResponseViewModel<SuccessResponse>> {
        const supplierOrganisation = await getRepository(SupplierOrganisation).findOne({
            supplier_id: supplierId,
        });

        if (!supplierOrganisation) {
            await getRepository(SupplierOrganisation).save({
                id: Util.guid(),
                supplier_id: supplierId,
                organisation_id: organisationId,
            });
        }

        return ResponseViewModel.withSuccess();
    }

    public async getOrganisationSupplier(
        organisationId: string,
        paginatorRequest: PaginatorRequest,
        categoryId?: string,
        productIds?: string[],
    ): Promise<ResponseViewModel<PaginatedResponseModel<OrganisationSupplierResponse>>> {
        const page = +(paginatorRequest.page || 1) > 0 ? +(paginatorRequest.page || 1) : 1;

        const query = getRepository(SupplierOrganisation)
            .createQueryBuilder('supplier_organisation')
            .select('supplier_organisation')
            .where('supplier_organisation.organisation_id = :organisationId', { organisationId });

        if (categoryId !== '') {
            query
                .innerJoinAndMapOne(
                    'supplier_organisation.supplier_category_product',
                    SupplierCategoryProduct,
                    'supplier_category_product',
                    'supplier_organisation.supplier_id = supplier_category_product.supplier_id',
                )
                .andWhere(`supplier_category_product.category_ids @> :categoryId`, {
                    categoryId: JSON.stringify([categoryId]),
                });
            if (Array.isArray(productIds)) {
                query.andWhere(`supplier_category_product.product_ids @> :productId`, {
                    productId: JSON.stringify(productIds),
                });
            }
        }

        const [supplierOrganisations, count] = await query
            .skip((page - 1) * Constant.pageSize)
            .take(Constant.pageSize)
            .orderBy('supplier_organisation.updated_date', 'DESC')
            .getManyAndCount();

        const supplierIds = supplierOrganisations.map((sg) => sg.supplier_id);
        const suppliersUserIds = await this.supplierUserService.getSuppliersUserIds(supplierIds);

        const suppliers = await getRepository(Supplier)
            .createQueryBuilder('c')
            .where('id in (:...supplierIds)', {
                supplierIds: supplierIds.length ? supplierIds : [''],
            })
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

        const supplierUsers = await this.userService.getByIds(suppliersUserIds);

        const indexedSuppliers: { [key: string]: User } = {};

        supplierUsers.forEach((s) => {
            indexedSuppliers[s.user_id] = s;
        });

        const data = suppliers.map((supplier) => {
            const filteredSupplierUsers = supplierUsers.filter((su) => su.supplier_id === supplier.id);
            const supplierCategoryProduct = categoryId
                ? supplierOrganisations.find((s) => s.supplier_id === supplier.id).supplier_category_product
                : null;
            return OrganisationSupplierResponse.fromModel(supplier, filteredSupplierUsers, supplierCategoryProduct);
        });
        const paginatedData = new PaginatedResponseModel<OrganisationSupplierResponse>(data, count, page);

        return ResponseViewModel.with(paginatedData);
    }

    public async organisationSupplierIds(organisationId: string): Promise<ResponseViewModel<string[]>> {
        const supplierOrganisations = await getRepository(SupplierOrganisation)
            .createQueryBuilder('so')
            .where('so.organisation_id = :organisationId', { organisationId })
            .getMany();

        const supplierIds = supplierOrganisations.map((supplierOrganisation) => supplierOrganisation.supplier_id);

        return ResponseViewModel.with(supplierIds);
    }

    public async getAll(
        organisationId: string,
        paginatorRequest: PaginatorRequest,
    ): Promise<{ supplierOrganisations: SupplierOrganisation[]; count: number }> {
        const page = +(paginatorRequest.page || 1) > 0 ? +(paginatorRequest.page || 1) : 1;

        const [supplierOrganisations, count] = await getRepository(SupplierOrganisation)
            .createQueryBuilder()
            .where('organisation_id = :organisationId', { organisationId })
            .skip((page - 1) * Constant.pageSize)
            .take(Constant.pageSize)
            .orderBy('updated_date', 'DESC')
            .getManyAndCount();

        return { supplierOrganisations, count };
    }

    public async getSupplierOrganisationByOrgId(organisationId: string): Promise<SupplierOrganisation[]> {
        const supplierOrg = await getRepository(SupplierOrganisation)
            .createQueryBuilder('supplier_organisation')
            .where('supplier_organisation.organisation_id =:orgId', { orgId: organisationId })
            .getMany();
        return supplierOrg;
    }

    public async getOrganisationIdsBySupplierIds(supplierIds: string[]): Promise<string[]> {
        const supplierOrgs = await getRepository(SupplierOrganisation)
            .createQueryBuilder('so')
            .where('so.supplier_id in (:...supplierIds)', { supplierIds: supplierIds.length ? supplierIds : [''] })
            .getMany();
        const orgIds = [...new Set(supplierOrgs.map((supplierOrg) => supplierOrg.organisation_id))];

        return orgIds;
    }
}
