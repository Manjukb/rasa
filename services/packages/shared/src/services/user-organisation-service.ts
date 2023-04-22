import { BusinessType, ClientType, Roles } from '../enum';
import { CompanyRequest, OrganisationWithAdminRequest, SupplierImportRequest } from '../viewmodels/requests';
import { ErrorModel, ResponseViewModel } from '../viewmodels/response-viewmodel';
import { Organisation, User } from '../database/models';

import { OrganisationAndUserResponse } from '../viewmodels/response';
import { Util } from '../helpers';
import { getRepository } from 'typeorm';
import { injectable } from 'inversify';
import { nanoid } from 'nanoid';
import { v4 as uuidv4 } from 'uuid';

type GetUserField = {
    email?: string;
    userId?: string;
};
type GetOrganisationField = {
    name?: string;
    organisationId?: string;
};

export interface UserOrganisationServiceContract {
    getUser(field: GetUserField): Promise<ResponseViewModel<User>>;
    getOrganisation(field: GetOrganisationField): Promise<ResponseViewModel<Organisation>>;
    getUsersByOrganisationId(organisationId: string): Promise<User[]>;
    createOrganisationAndAdmin(
        request: OrganisationWithAdminRequest,
    ): Promise<ResponseViewModel<OrganisationAndUserResponse>>;
    getOrCreate(request: SupplierImportRequest): Promise<Organisation>;
}
@injectable()
export class UserOrganisationService implements UserOrganisationServiceContract {
    public async getUser(field: GetUserField): Promise<ResponseViewModel<User>> {
        const response = new ResponseViewModel<User>();
        const query = getRepository(User).createQueryBuilder();

        if (field.email) {
            query.where(`LOWER(email) = :email`, { email: field.email.toLowerCase() });
        } else if (field.userId) {
            query.where(`user_id = :userId`, { userId: field.userId });
        }

        const user = await query.getOne();
        if (user) {
            response.data = user;

            return response;
        }
        response.errors.push(new ErrorModel(`no user found`));

        return response;
    }

    public async getOrganisation(field: GetOrganisationField): Promise<ResponseViewModel<Organisation>> {
        const response = new ResponseViewModel<Organisation>();
        const query = getRepository(Organisation).createQueryBuilder();

        if (field.organisationId) {
            query.where(`organisation_id = :organisationId`, { organisationId: field.organisationId });
        } else if (field.name) {
            query.where(`LOWER(name) = :name`, { name: field.name.toLowerCase() });
        }

        const organisation = await query.getOne();

        if (organisation) {
            organisation.business_types = organisation.business_type ? organisation.business_type.split(',') : [];
            response.data = organisation;

            return response;
        }
        response.errors.push(new ErrorModel(`No organisation found`));

        return response;
    }

    public async getUsersByOrganisationId(organisationId: string): Promise<User[]> {
        const users = await getRepository(User).find({
            organisation_id: organisationId,
        });

        return users;
    }

    private async createOrganisation(request: OrganisationWithAdminRequest): Promise<Organisation> {
        const organisation = new Organisation();
        organisation.organisation_id = nanoid(20);
        organisation.organisation_info = { name: request.name, status: 'active' };
        organisation.business_type = request.business_types.toString();
        organisation.is_active = true;
        organisation.client_type = request.client_type;
        organisation.created_by = request.created_by;
        organisation.updated_by = request.updated_by;
        organisation.name = request.name;
        organisation.timezone = request.timezone;
        organisation.domains = request.domains.join(',');

        const newOrg = await getRepository(Organisation).save(organisation);

        return newOrg;
    }

    private async createOrganisationAdmin(
        request: OrganisationWithAdminRequest,
        organisation: Organisation,
    ): Promise<User> {
        const user = new User();
        user.email = request.admin.email;
        user.authority = organisation.client_type === ClientType.enterprise ? Roles.enterprise_admin : Roles.saas_admin;
        // user.authority = Roles.org_admin;
        user.organisation_id = organisation.organisation_id;
        user.created_by = request.created_by;
        user.updated_by = request.updated_by;
        user.user_status = true;
        user.user_id = nanoid(20);
        user.name = request.admin.name;
        user.user_info = { authority: user.authority, email: user.email, name: user.name };
        user.password_hash = uuidv4();
        user.hashPassword();
        user.password_key = uuidv4();
        user.password_key_valid_till = new Date(new Date().setDate(new Date().getDate() + 10));
        user.business_type = request.business_types.join(',');

        const newUser = await getRepository(User).save(user);

        return newUser;
    }

    public async createOrganisationAndAdmin(
        request: OrganisationWithAdminRequest,
    ): Promise<ResponseViewModel<OrganisationAndUserResponse>> {
        const response = new ResponseViewModel<OrganisationAndUserResponse>();

        const newOrg = await this.createOrganisation(request);
        const newUser = await this.createOrganisationAdmin(request, newOrg);

        response.data = { user: newUser, organisation: newOrg };

        return response;
    }

    public async getOrCreate(request: SupplierImportRequest): Promise<Organisation> {
        const transformedRequest = CompanyRequest.requestFromSupplierImportRequest(request);
        const company = await getRepository(Organisation)
            .createQueryBuilder('comp')
            .where(`LOWER(name) = :name`, { name: transformedRequest.name.toLowerCase() })
            .andWhere(`LOWER(address) = :address`, { address: transformedRequest.address.toLowerCase() })
            .getOne();
        if (company) {
            return company;
        }
        const newOrg: Organisation = new Organisation();

        newOrg.organisation_id = Util.guid();
        newOrg.organisation_info = { name: request.company_name, status: 'active' };
        newOrg.business_type = BusinessType.procurement;
        newOrg.client_type = ClientType.enterprise;
        newOrg.created_by = request.created_by;
        newOrg.updated_by = request.updated_by;
        newOrg.name = request.company_name;
        newOrg.address = request.company_address;
        const newCompany = await getRepository(Organisation).save(newOrg);

        return newCompany;
    }
}
