import { SupplierImportRequest, SupplierRequest } from './..';

import { SupplierCompany } from '../database/models';
import { Util } from '../helpers';
import { getRepository } from 'typeorm';
import { injectable } from 'inversify';

export interface SupplierCompanyServiceContract {
    getOrCreate(request: any): Promise<SupplierCompany>;
    getBySupplierCompanyIds(supplierCompanyIds: string[]): Promise<SupplierCompany[]>;
}

@injectable()
export class SupplierCompanyService implements SupplierCompanyServiceContract {
    public async getOrCreate(request: SupplierImportRequest): Promise<SupplierCompany> {
        const transformedRequest = SupplierRequest.requestFromSupplierImportRequest(request);
        const supplierCompany =
            transformedRequest &&
            (await getRepository(SupplierCompany)
                .createQueryBuilder('supplier_company')
                .where(`LOWER(name) = :name`, { name: transformedRequest.name.toLowerCase() })
                .andWhere(`LOWER(address) = :address`, { address: transformedRequest.address.toLowerCase() })
                .getOne());
        if (supplierCompany) {
            return supplierCompany;
        }

        transformedRequest.id = Util.guid();
        const newSupplierCompany = await getRepository(SupplierCompany).save(transformedRequest);

        return newSupplierCompany;
    }

    public async getBySupplierCompanyIds(supplierCompanyIds: string[]): Promise<SupplierCompany[]> {
        const supplierCompanies = await getRepository(SupplierCompany)
            .createQueryBuilder('supplier_company')
            .where('supplier_company.id IN (:...ids)', { ids: supplierCompanyIds.length ? supplierCompanyIds : [''] })
            .getMany();
        return supplierCompanies;
    }
}
