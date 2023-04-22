import { EmbedAuthenticationResponse, SuccessResponse } from '../viewmodels/response';
import { HandshakeRequest, TenantUserRequest, ModifyTenantRequest } from '../viewmodels/requests';
import { getRepository } from 'typeorm';
import { ErrorModel, ResponseViewModel } from '../viewmodels/response-viewmodel';
import { Tenant, TenantUser } from '../database/models';
import { injectable, inject } from 'inversify';
import { TenantUserServiceContract } from './tenant-user-service';
import { Util } from '../helpers';
import { ClientType } from '../enum';
import { SaasEmbedValidator, SaasUserEmbedValidator } from '../validators';
import { ValidationError } from 'yup';
import { TenantResponse } from '../viewmodels/response/tenant-response';

export interface TenantServiceContract {
    getEmbedToken(request: HandshakeRequest): Promise<ResponseViewModel<EmbedAuthenticationResponse>>;
    save(tenantRequest: ModifyTenantRequest): Promise<ResponseViewModel<TenantResponse>>;
    get(id: string): Promise<ResponseViewModel<TenantResponse>>;
    getByIdentifier(identifier: string): Promise<ResponseViewModel<TenantResponse>>;
}

@injectable()
export class TenantService implements TenantServiceContract {
    public constructor(@inject('TenantUserService') private readonly tenantUserService: TenantUserServiceContract) {}
    //#region private methods
    private async validateSaasHandshakeRequest(request: HandshakeRequest): Promise<ResponseViewModel<SuccessResponse>> {
        const response = new ResponseViewModel<SuccessResponse>();
        try {
            await SaasEmbedValidator.validate(request, { abortEarly: false });
        } catch (validationErrors) {
            const { inner } = validationErrors as ValidationError;
            inner.forEach((errorData) => {
                response.errors.push(new ErrorModel(errorData.message, errorData.path));
            });
        }
        return response;
    }
    private async validateHandshakeRequest(request: HandshakeRequest): Promise<ResponseViewModel<SuccessResponse>> {
        const response = new ResponseViewModel<SuccessResponse>();
        try {
            await SaasUserEmbedValidator.validate(request, { abortEarly: false });
        } catch (validationErrors) {
            const { inner } = validationErrors as ValidationError;
            inner.forEach((errorData) => {
                response.errors.push(new ErrorModel(errorData.message, errorData.path));
            });
        }
        return response;
    }

    private generateUserToken(tenantUser: TenantUser): EmbedAuthenticationResponse {
        const tokenData = { user_id: tenantUser.id, role: tenantUser.role, type: ClientType['saas-based'] };
        const token = Util.generateToken(tokenData);

        return { token, type: ClientType['saas-based'] };
    }

    private async getTenantByExternalId(organisationId: string, tenantIdentifier?: string): Promise<Tenant> {
        const query = getRepository(Tenant)
            .createQueryBuilder('tenant')
            .where('tenant.organisation_id = :organisation_id', {
                organisation_id: organisationId,
            });

        if (tenantIdentifier) {
            query.andWhere('tenant.identifier = :tenantIdentifier', { tenantIdentifier });
        }

        return await query.getOne();
    }

    private async saveInternal(tenantRequest: ModifyTenantRequest): Promise<Tenant> {
        let tenant = await this.getTenantByExternalId(
            tenantRequest.organisation.organisation_id,
            tenantRequest.tenant_id,
        );
        if (!tenant) {
            tenant = new Tenant();
            tenant.id = Util.newId();
        }
        tenant.business_type = tenantRequest.tenant_type;
        // tenant.business_type = tenantRequest.organisation.business_type;
        tenant.name = tenantRequest.tenant_name;
        tenant.organisation_id = tenantRequest.organisation.organisation_id;
        tenant.identifier = tenantRequest.tenant_id;

        return await getRepository(Tenant).save(tenant);
    }
    //#endregion
    public async save(tenantRequest: ModifyTenantRequest): Promise<ResponseViewModel<TenantResponse>> {
        const tenant = await this.saveInternal(tenantRequest);

        return ResponseViewModel.with<TenantResponse>(TenantResponse.fromModel(tenant));
    }

    public async getEmbedToken(request: HandshakeRequest): Promise<ResponseViewModel<EmbedAuthenticationResponse>> {
        const response = new ResponseViewModel<EmbedAuthenticationResponse>();
        const validationSaasResponse = await this.validateSaasHandshakeRequest(request);

        if (validationSaasResponse.errors && validationSaasResponse.errors.length) {
            const errors = validationSaasResponse.errors;
            response.errors = errors;

            return response;
        }

        const validationResponse = await this.validateHandshakeRequest(request);

        if (validationResponse.errors && validationResponse.errors.length) {
            const errors = validationResponse.errors;
            response.errors = errors;

            return response;
        }

        const tenant = await this.saveInternal(request);
        // create/ tenant user
        const tenantUserRequest = new TenantUserRequest(request, tenant.id);
        const tenantUser = (await this.tenantUserService.getOrCreate(tenantUserRequest)).data;

        // if (!tenantUser && !isAlreadyCreated) {
        //     await getRepository(Tenant).delete({ id: newTenant.id });
        // }

        response.data = this.generateUserToken(tenantUser);

        return response;
    }

    public async get(id: string): Promise<ResponseViewModel<TenantResponse>> {
        const tenant = await getRepository(Tenant).findOne({ where: { id } });

        if (!tenant) {
            return ResponseViewModel.withError('invalid tenant-id');
        }
        return ResponseViewModel.with<TenantResponse>(TenantResponse.fromModel(tenant));
    }

    public async getByIdentifier(identifier: string): Promise<ResponseViewModel<TenantResponse>> {
        const tenant = await getRepository(Tenant).findOne({ where: { identifier } });
        if (!tenant) {
            return ResponseViewModel.withError('invalid tenant-id');
        }

        return ResponseViewModel.with<TenantResponse>(TenantResponse.fromModel(tenant));
    }
}
