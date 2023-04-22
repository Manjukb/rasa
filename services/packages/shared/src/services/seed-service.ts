import { BusinessType, ClientType, Roles } from '../enum';
import { ErrorModel, ResponseViewModel } from '../viewmodels/response-viewmodel';
import { Organisation, User } from '../database/models';

import { Constant } from '../helpers';
import { SuccessResponse } from '../viewmodels/response';
import { getRepository } from 'typeorm';
import { injectable } from 'inversify';
import { nanoid } from 'nanoid';

export interface SeedServiceContract {
    createSuperAdmin(): Promise<ResponseViewModel<User | SuccessResponse>>;
    createOrganisation(): Promise<ResponseViewModel<Organisation | SuccessResponse>>;
}

@injectable()
export class SeedService implements SeedServiceContract {
    private superAdminEmail = Constant.seedData.superAdminEmail;
    private superAdminName = Constant.seedData.superAdminName;
    private organisationName = Constant.seedData.organisationName;

    public async createOrganisation(): Promise<ResponseViewModel<Organisation | SuccessResponse>> {
        const response = new ResponseViewModel<Organisation | SuccessResponse>();

        const organisation = await getRepository(Organisation).findOne({ name: this.organisationName });
        if (organisation) {
            response.data = organisation;

            return response;
        }

        const newOrganisation = new Organisation();
        newOrganisation.organisation_id = nanoid(20);
        newOrganisation.name = this.organisationName;
        newOrganisation.is_active = true;
        newOrganisation.client_type = ClientType.enterprise;
        newOrganisation.business_type = [BusinessType.collections, BusinessType.procurement, BusinessType.sales].join(
            ',',
        );
        newOrganisation.organisation_info = { name: newOrganisation.name, status: 'active' };

        await getRepository(Organisation).save(newOrganisation);
        response.data = newOrganisation;

        return response;
    }

    public async createSuperAdmin(): Promise<ResponseViewModel<User | SuccessResponse>> {
        const response = new ResponseViewModel<User | SuccessResponse>();

        const userByEmail = await getRepository(User).findOne({ email: this.superAdminEmail });
        if (userByEmail) {
            response.data = userByEmail;

            return response;
        }

        const organisation = await getRepository(Organisation).findOne({ name: this.organisationName });
        if (organisation) {
            const user = new User();
            user.user_id = nanoid(20);
            user.email = this.superAdminEmail;
            user.organisation_id = organisation.organisation_id;
            user.password_hash = 'tojeqa50@';
            user.authority = Roles.super_admin;
            user.hashPassword();
            user.user_status = true;
            user.user_info = { name: this.superAdminName, email: user.email, authority: user.authority };
            await getRepository(User).save(user);

            response.data = user;

            return response;
        }
        response.errors.push(
            new ErrorModel(`There is no organisation by name: ${this.organisationName}`, 'no-organisation'),
        );

        return response;
    }
}
