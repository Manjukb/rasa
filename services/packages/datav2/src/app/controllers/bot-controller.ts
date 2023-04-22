import { Controller, Delete, Get, interfaces, Post, Put } from 'inversify-restify-utils';

import {
    AuthMiddleware,
    BotRequest,
    BotResponse,
    BotSchemaResponse,
    BotServiceContract,
    CheckRoleMiddleware,
    CreateBotValidator,
    Roles,
    SuccessResponse,
    TrimMiddleware,
    WithUserRequest,
} from '@negobot/shared/';
import { ControllerBase } from './controller-base';
import { ResponseViewModel } from '@negobot/shared/';
import { inject, injectable } from 'inversify';

@Controller('/bot')
@injectable()
export class BotController extends ControllerBase implements interfaces.Controller {
    public constructor(@inject('BotService') private readonly botService: BotServiceContract) {
        super();
    }

    @Post(
        '/',
        AuthMiddleware,
        TrimMiddleware,
        CheckRoleMiddleware([Roles.super_admin, Roles.enterprise_admin, Roles.saas_admin, Roles.tenant_admin]),
    )
    public async createBot(request: WithUserRequest): Promise<ResponseViewModel<SuccessResponse | null> | null> {
        const validationResult = await super.validate<SuccessResponse>(request, CreateBotValidator);
        if (validationResult) {
            return validationResult;
        }
        const user = request.user;

        const botRequest = super.withOutAuthTransform<BotRequest>(request, BotRequest);

        return this.botService.create(user, botRequest);
    }

    @Put(
        '/:id',
        AuthMiddleware,
        TrimMiddleware,
        CheckRoleMiddleware([Roles.super_admin, Roles.enterprise_admin, Roles.saas_admin, Roles.tenant_admin]),
    )
    public async updateBot(request: WithUserRequest): Promise<ResponseViewModel<SuccessResponse | null> | null> {
        const validationResult = await super.validate<SuccessResponse>(request, CreateBotValidator);
        if (validationResult) {
            return validationResult;
        }
        const user = request.user;
        const botRequest = super.withOutAuthTransform<BotRequest>(request, BotRequest);

        return this.botService.update(user, botRequest);
    }

    @Get('/schema')
    public schema(): ResponseViewModel<BotSchemaResponse> {
        return this.botService.schema();
    }

    @Get(
        '/all',
        AuthMiddleware,
        TrimMiddleware,
        CheckRoleMiddleware([Roles.super_admin, Roles.enterprise_admin, Roles.saas_admin, Roles.tenant_admin]),
    )
    public async getAll(request: WithUserRequest): Promise<ResponseViewModel<BotResponse[]>> {
        const { user } = request;

        return this.botService.getAll(user);
    }

    @Get(
        '/:id',
        AuthMiddleware,
        TrimMiddleware,
        CheckRoleMiddleware([Roles.super_admin, Roles.enterprise_admin, Roles.saas_admin, Roles.tenant_admin]),
    )
    public async getById(request: WithUserRequest): Promise<ResponseViewModel<BotResponse>> {
        const { id } = request.params;

        return this.botService.getById(id, request.user.organisation_id);
    }

    @Get(
        '/',
        AuthMiddleware,
        TrimMiddleware,
        CheckRoleMiddleware([Roles.super_admin, Roles.enterprise_admin, Roles.saas_admin, Roles.tenant_admin]),
    )
    public async getByCategory(request: WithUserRequest): Promise<ResponseViewModel<BotResponse>> {
        // TODO: add a validation on business_type and category_id being required
        const { category_id: categoryId, business_type: businessType } = request.query;
        return this.botService.getOrganisationBot(
            request.user.organisation_id,
            businessType,
            request.user.tenant_id,
            categoryId,
        );
    }

    @Delete('/:id', AuthMiddleware, TrimMiddleware, CheckRoleMiddleware([Roles.enterprise_admin, Roles.tenant_admin]))
    public async delete(request: WithUserRequest): Promise<ResponseViewModel<SuccessResponse | null> | null> {
        const { id } = request.params;

        return this.botService.delete(id, request.user);
    }
}
