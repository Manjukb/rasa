import { Organisation, OrganisationCompany } from '../database/models';
import { injectable } from 'inversify';
import { getRepository } from 'typeorm';
import { Util } from '../helpers';

export interface OrganisationCompanyServiceContract {
    getOrCreate(company: Organisation, organisationId: string): Promise<OrganisationCompany>;
}

@injectable()
export class OrganisationCompanyService implements OrganisationCompanyServiceContract {
    public async getOrCreate(company: Organisation, organisationId: string): Promise<OrganisationCompany> {
        const result = await getRepository(OrganisationCompany)
            .createQueryBuilder('cs')
            .where(`organisation_id = :organisationId`, { organisationId })
            .andWhere(`company_id = :companyId`, { companyId: company.organisation_id })
            .getOne();
        if (result) {
            return result;
        }
        const organisationCompany = new OrganisationCompany();
        organisationCompany.id = Util.guid();
        organisationCompany.organisation_id = organisationId;
        organisationCompany.company_id = company.organisation_id;
        await getRepository(OrganisationCompany).save(organisationCompany);

        return organisationCompany;
    }
}
