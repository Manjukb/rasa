import { Constant, Util } from '../helpers';
import { ErrorModel, ResponseViewModel } from '../viewmodels/response-viewmodel';
import { RequestUserResponse, UserResponse } from '../viewmodels/response';

import { OrganisationLightWeightResponseTransformer } from '../transformer';
import { Tenant, TenantUser } from '../database/models';
import { TenantUserRequest } from '../viewmodels/requests';
import { getRepository } from 'typeorm';
import { injectable, inject } from 'inversify';
import { Roles } from '../enum';
import { OrganisationServiceContract } from '.';

export interface TenantUserServiceContract {
    getOrCreate(request: TenantUserRequest): Promise<ResponseViewModel<TenantUser>>;
    getLightWeight(user: RequestUserResponse): Promise<ResponseViewModel<UserResponse>>;
    getUser(userId: string): Promise<ResponseViewModel<RequestUserResponse>>;
    getUsersByTenantId(tenant_id: string): Promise<ResponseViewModel<TenantUser[]>>;
    setUserIsOnChannel(userId: string): Promise<boolean>;
    getAdminByTenantId(tenantId: string): Promise<ResponseViewModel<TenantUser>>;
}

@injectable()
export class TenantUserService implements TenantUserServiceContract {
    public constructor(
        @inject('OrganisationService') private readonly organisationService: OrganisationServiceContract,
    ) {}
    public async getUser(userId: string): Promise<ResponseViewModel<RequestUserResponse>> {
        const response = new ResponseViewModel<RequestUserResponse>();
        const user = await getRepository(TenantUser)
            .createQueryBuilder('tu')
            .where('tu.id = :userId', { userId })
            .getOne();

        if (!user) {
            response.errors.push(new ErrorModel(Constant.ERROR_MESSAGES.DEFAULT_TOKEN_ERROR));

            return response;
        }

        if (!user.is_active) {
            response.errors.push(new ErrorModel(Constant.ERROR_MESSAGES.ACCOUNT_DEACTIVATED));

            return response;
        }

        const tenant = await getRepository(Tenant).findOne(user.tenant_id);
        const organisation = (await this.organisationService.getById(tenant.organisation_id)).data;
        const businessTypes = organisation.business_type.split(',');

        response.data = {
            email: user.identifier,
            user_id: user.id,
            role: user.role,
            status: user.is_active,
            organisation_id: tenant.organisation_id,
            tenant_id: user.tenant_id,
            is_on_channel: user.is_on_channel,
            business_types: businessTypes,
        };

        return response;
    }

    public async getOrCreate(request: TenantUserRequest): Promise<ResponseViewModel<TenantUser>> {
        const response = new ResponseViewModel<TenantUser>();

        const tenantUser = await getRepository(TenantUser)
            .createQueryBuilder('tu')
            .where('LOWER(identifier) = :identifier', { identifier: request.identifier.trim().toLocaleLowerCase() })
            .andWhere('tu.tenant_id = :tenant_id', { tenant_id: request.tenant_id })
            .getOne();

        if (!tenantUser) {
            const newTenantUser = new TenantUser();
            newTenantUser.id = Util.newId();
            newTenantUser.name = request.name;
            newTenantUser.identifier = request.identifier;
            newTenantUser.role = request.role;
            newTenantUser.tenant_id = request.tenant_id;
            await getRepository(TenantUser).save(newTenantUser);
            response.data = newTenantUser;

            return response;
        }

        response.data = tenantUser;

        return response;
    }

    public async getLightWeight(user: RequestUserResponse): Promise<ResponseViewModel<UserResponse>> {
        const response = new ResponseViewModel<UserResponse>();
        const data = await getRepository(TenantUser)
            .createQueryBuilder('tu')
            .innerJoinAndSelect('tu.tenant', 'tenant')
            .innerJoinAndSelect('tenant.organisation', 'organisation')
            .where('tu.id = :userId', { userId: user.user_id })
            .getOne();

        if (data) {
            response.data = {
                id: data.id,
                user_id: data.id,
                name: data.name,
                email: data.identifier,
                status: data.is_active,
                role: data.role,
                business_types: [data.tenant.business_type],
                organisation_id: data.tenant.organisation_id,
                tenant_id: data.tenant_id,
                organisation: OrganisationLightWeightResponseTransformer.transform(data.tenant.organisation),
            };

            return response;
        }

        response.errors.push(new ErrorModel('Invalid user id', 'id'));

        return response;
    }

    public async getUsersByTenantId(tenantId: string): Promise<ResponseViewModel<TenantUser[]>> {
        const tenantUsers = await getRepository(TenantUser).find({ tenant_id: tenantId });
        if (!tenantUsers.length) {
            return ResponseViewModel.withError('No user found for the tenant');
        }

        return ResponseViewModel.with(tenantUsers);
    }

    public async setUserIsOnChannel(tenantUserId: string): Promise<boolean> {
        await getRepository(TenantUser).update({ id: tenantUserId }, { is_on_channel: true });

        return true;
    }

    public async getAdminByTenantId(tenantId: string): Promise<ResponseViewModel<TenantUser>> {
        const tenantUser = await getRepository(TenantUser).findOne({ tenant_id: tenantId, role: Roles.tenant_admin });
        if (!tenantUser) {
            return ResponseViewModel.withError('No user found for the tenant');
        }

        return ResponseViewModel.with(tenantUser);
    }
}
