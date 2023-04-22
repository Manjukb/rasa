import { Controller, interfaces, Get, Post } from 'inversify-restify-utils';

import {
    ApiKeyRequest,
    AuthMiddleware,
    CheckRoleMiddleware,
    CreateApiKeyValidator,
    Logger,
    SuccessResponse,
    WithUserRequest,
} from '@negobot/shared/';
import { ControllerBase } from './controller-base';
import { ApiKeyServiceContract } from '@negobot/shared//';
import { ResponseViewModel } from '@negobot/shared/';
import { inject, injectable } from 'inversify';
import { ApiKeyResponse } from '@negobot/shared/';
import { Roles } from '@negobot/shared/';
import { Request } from 'restify';

@Controller('/api-key', AuthMiddleware)
@injectable()
export class ApiKeyController extends ControllerBase implements interfaces.Controller {
    public constructor(@inject('ApiKeyService') private readonly apiKeyService: ApiKeyServiceContract) {
        super();
    }

    @Get('/all', CheckRoleMiddleware([Roles.super_admin, Roles.enterprise_admin, Roles.org_admin, Roles.saas_admin]))
    public async getAll(): Promise<ResponseViewModel<ApiKeyResponse[]>> {
        console.info('request received at', new Date());
        Logger.log.info({ message: 'request received in controller' });
        return await this.apiKeyService.getAll();
    }

    @Get('/', CheckRoleMiddleware([Roles.super_admin, Roles.enterprise_admin, Roles.org_admin, Roles.saas_admin]))
    public async getCurrentUserOrganisationKey(request: WithUserRequest): Promise<ResponseViewModel<ApiKeyResponse>> {
        const { organisation_id } = request.user;

        return this.apiKeyService.getOrganisationKey(organisation_id);
    }

    @Get(
        '/:organisation_id',
        CheckRoleMiddleware([Roles.super_admin, Roles.enterprise_admin, Roles.org_admin, Roles.saas_admin]),
    )
    public async getOrganisationKey(request: Request): Promise<ResponseViewModel<ApiKeyResponse>> {
        const { organisation_id } = request.params;

        return this.apiKeyService.getOrganisationKey(organisation_id);
    }

    @Post('/create', CheckRoleMiddleware([Roles.super_admin, Roles.enterprise_admin, Roles.saas_admin]))
    public async create(request: WithUserRequest): Promise<ResponseViewModel<SuccessResponse | null> | null> {
        const validationResult = await super.validate<SuccessResponse>(request, CreateApiKeyValidator);

        if (validationResult) {
            return validationResult;
        }

        const apiKeyRequest = super.withOutAuthTransform<ApiKeyRequest>(request, ApiKeyRequest);
        const { user } = request;

        return this.apiKeyService.create(apiKeyRequest, user);
    }
}
