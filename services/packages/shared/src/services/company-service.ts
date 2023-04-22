import { Company } from '../database/models';
import { CompanyRequest, SupplierImportRequest } from '../viewmodels/requests';
import { injectable } from 'inversify';
import { getRepository } from 'typeorm';
import { Util } from '../helpers';

export interface CompanyServiceContract {
    getOrCreate(request: SupplierImportRequest): Promise<Company>;
}

@injectable()
export class CompanyService implements CompanyServiceContract {
    public async getOrCreate(request: SupplierImportRequest): Promise<Company> {
        const transformedRequest = CompanyRequest.requestFromSupplierImportRequest(request);
        const company = await getRepository(Company)
            .createQueryBuilder('comp')
            .where(`organisation_id = :organisation_id`, { organisation_id: transformedRequest.organisation_id })
            .andWhere(`LOWER(name) = :name`, { name: transformedRequest.name.toLowerCase() })
            .andWhere(`LOWER(address) = :address`, { address: transformedRequest.address.toLowerCase() })
            .getOne();
        if (company) {
            return company;
        }

        transformedRequest.id = Util.guid();
        const newCompany = await getRepository(Company).save(transformedRequest);

        return newCompany;
    }
}
