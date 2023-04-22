import { Controller, Get, interfaces, Post } from 'inversify-restify-utils';

import {
    SettingRequest,
    AuthMiddleware,
    CheckRoleMiddleware,
    CreateSettingValidator,
    SettingServiceContract,
    SuccessResponse,
    WithUserRequest,
    SettingResponse,
} from '@negobot/shared/';
import { ControllerBase } from './controller-base';
import { ResponseViewModel } from '@negobot/shared/';
import { inject, injectable } from 'inversify';
import { Roles } from '@negobot/shared/';

@Controller('/setting', AuthMiddleware)
@injectable()
export class SettingController extends ControllerBase implements interfaces.Controller {
    public constructor(@inject('SettingService') private readonly settingService: SettingServiceContract) {
        super();
    }

    @Post('/create', CheckRoleMiddleware([Roles.super_admin, Roles.enterprise_admin, Roles.saas_admin]))
    public async create(request: WithUserRequest): Promise<ResponseViewModel<SuccessResponse | null> | null> {
        const validationResult = await super.validate<SuccessResponse>(request, CreateSettingValidator);

        if (validationResult) {
            return validationResult;
        }

        const settingRequest = super.withOutAuthTransform<SettingRequest>(request, SettingRequest);

        return this.settingService.create(settingRequest);
    }

    @Get('/', CheckRoleMiddleware([Roles.super_admin, Roles.enterprise_admin, Roles.saas_admin]))
    public async get(request: WithUserRequest): Promise<ResponseViewModel<SettingResponse>> {
        const user = request.user;

        return this.settingService.getSetting(user, user.organisation_id);
    }

    @Get('/productParameters', CheckRoleMiddleware([Roles.super_admin, Roles.enterprise_admin, Roles.saas_admin]))
    public async getProductParameters(request: WithUserRequest): Promise<string[]> {
        const user = request.user;

        return this.settingService.getProductParameter(user.organisation_id);
    }

    @Get('/:id', CheckRoleMiddleware([Roles.super_admin, Roles.enterprise_admin, Roles.saas_admin]))
    public async getById(request: WithUserRequest): Promise<ResponseViewModel<SettingResponse>> {
        const user = request.user;
        const { id } = request.params;

        return this.settingService.getSetting(user, id);
    }
}
