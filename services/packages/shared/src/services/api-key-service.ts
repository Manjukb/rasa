import { ApiKeyResponse, RequestUserResponse, SuccessResponse } from '../viewmodels/response';
import { ErrorModel, ResponseViewModel } from '../viewmodels/response-viewmodel';

import { ApiKey } from '../database/models';
import { ApiKeyRequest } from '../viewmodels/requests';
import { ApiKeyResponseTransformer } from '../transformer/api-key-response-transformer';
import { RoleService } from './';
import { getRepository } from 'typeorm';
import { injectable } from 'inversify';
import { nanoid } from 'nanoid';

export interface ApiKeyServiceContract {
    create(request: ApiKeyRequest, user?: RequestUserResponse): Promise<ResponseViewModel<SuccessResponse>>;
    getAll(): Promise<ResponseViewModel<ApiKeyResponse[]>>;
    getOrganisationKey(organisation_id: string): Promise<ResponseViewModel<ApiKeyResponse>>;
    getDetailByAPIKey(apiKey: string): Promise<ResponseViewModel<ApiKey>>;
}
@injectable()
export class ApiKeyService implements ApiKeyServiceContract {
    public async getAll(): Promise<ResponseViewModel<ApiKeyResponse[]>> {
        const response = new ResponseViewModel<ApiKeyResponse[]>();
        console.info('getting repository at', new Date());
        const apiKeys = await getRepository(ApiKey)
            .createQueryBuilder('api')
            .innerJoinAndSelect('api.organisation', 'organisation')
            .getMany();
        console.info('got repository at', new Date());
        if (!apiKeys) {
            response.errors.push(new ErrorModel('No organisation found', 'no-organisation'));

            return response;
        }

        response.data = ApiKeyResponseTransformer.transformMultiple(apiKeys);
        console.info('returned data at', new Date());
        return response;
    }

    public async create(
        request: ApiKeyRequest,
        user?: RequestUserResponse,
    ): Promise<ResponseViewModel<SuccessResponse>> {
        const response = new ResponseViewModel<SuccessResponse>();
        const apiKey = new ApiKey();
        apiKey.business_type = request.business_type;
        apiKey.organisation_id = request.organisation_id;
        apiKey.user_id = request.user_id;
        apiKey.authority = request.authority;
        const isSuperAdmin = user ? new RoleService().isSuperAdmin(user) : false;

        if (user) {
            apiKey.user_id = user.user_id;
            apiKey.authority = user.role;

            if (!isSuperAdmin) {
                apiKey.organisation_id = user.organisation_id;
            }
        }

        apiKey.api_key = nanoid(20);
        apiKey.issued_date = new Date();
        apiKey.expired_date = new Date(new Date().setDate(new Date().getDate() + 200));

        await getRepository(ApiKey).save(apiKey);
        response.data = { success: true };

        return response;
    }

    public async getOrganisationKey(organisation_id: string): Promise<ResponseViewModel<ApiKeyResponse>> {
        const response = new ResponseViewModel<ApiKeyResponse>();

        const apiKey = await getRepository(ApiKey)
            .createQueryBuilder('api')
            .innerJoinAndSelect('api.organisation', 'organisation')
            .where('api.organisation_id = :organisation_id', { organisation_id })
            .getOne();

        if (!apiKey) {
            response.errors.push(new ErrorModel('No organisation found', 'no-organisation'));

            return response;
        }

        response.data = ApiKeyResponseTransformer.transform(apiKey);

        return response;
    }

    public async getDetailByAPIKey(apiKey: string): Promise<ResponseViewModel<ApiKey>> {
        const response = new ResponseViewModel<ApiKey>();
        const result = await getRepository(ApiKey)
            .createQueryBuilder('api_key')
            .innerJoinAndSelect('api_key.organisation', 'organisation')
            .where('api_key.api_key = :apiKey', { apiKey })
            .getOne();

        if (!result) {
            response.errors.push(new ErrorModel('invalid api-key', 'api-key'));

            return response;
        }

        if (result) {
            const expiredDate = result.expired_date.getTime();
            const now = new Date().getTime();

            if (!result.is_active) {
                response.errors.push(new ErrorModel('Api Key is in-active', 'api-key'));

                return response;
            }

            if (now > expiredDate) {
                response.errors.push(new ErrorModel('Api Key is expired', 'api-key'));

                return response;
            }
        }

        response.data = result;

        return response;
    }
}
