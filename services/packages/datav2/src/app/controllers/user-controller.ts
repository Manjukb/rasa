import { Controller, Post, interfaces, Get, Put } from 'inversify-restify-utils';

import {
    AuthMiddleware,
    CheckRoleMiddleware,
    Constant,
    CreateUserValidator,
    TrimMiddleware,
    UpdateUserRequest,
    UpdateUserValidator,
    Util,
} from '@negobot/shared/';
import { ControllerBase } from './controller-base';
import { UserServiceContract } from '@negobot/shared/';
import { ResponseViewModel } from '@negobot/shared/';
import { WithUserRequest } from '@negobot/shared/';
import { inject, injectable } from 'inversify';
import { CreateClientAdminValidator, CreateEnterpriseUserValidator, UpdatePasswordValidator } from '@negobot/shared/';
import { SuccessResponse, UserResponse } from '@negobot/shared/';
import { ClientAdminRequest, UpdatePasswordRequest, UserRequest } from '@negobot/shared/';
import { Request, Response } from 'restify';
import { Roles } from '@negobot/shared/';

@Controller('/user', AuthMiddleware)
@injectable()
export class UserController extends ControllerBase implements interfaces.Controller {
    public constructor(@inject('UserService') private readonly userService: UserServiceContract) {
        super();
    }

    @Get('/all', CheckRoleMiddleware([Roles.super_admin, Roles.enterprise_admin, Roles.org_admin, Roles.saas_admin]))
    public async getAll(request: WithUserRequest): Promise<ResponseViewModel<UserResponse[]>> {
        return this.userService.getLightWeightList(request.user);
    }

    @Get('/:id')
    public async getById(request: Request): Promise<ResponseViewModel<UserResponse>> {
        const userId = request.params.id;

        return this.userService.getLightWeight(userId);
    }

    @Post('/client-admin', TrimMiddleware, CheckRoleMiddleware([Roles.super_admin]))
    public async create(request: WithUserRequest): Promise<ResponseViewModel<SuccessResponse | null> | null> {
        const validationResult = await super.validate<SuccessResponse>(request, CreateClientAdminValidator);
        if (validationResult) {
            return validationResult;
        }

        const adminRequest = super.transform<ClientAdminRequest>(request, ClientAdminRequest);

        return this.userService.createClientAdmin(adminRequest);
    }

    @Post('/update-password', TrimMiddleware)
    public async updatePassword(request: WithUserRequest): Promise<ResponseViewModel<SuccessResponse | null> | null> {
        const validationResult = await super.validate<SuccessResponse>(request, UpdatePasswordValidator);
        if (validationResult) {
            return validationResult;
        }

        const updatePasswordRequest = super.withOutAuthTransform<UpdatePasswordRequest>(request, UpdatePasswordRequest);
        const userId = request.user.user_id;

        return this.userService.updatePassword(userId, updatePasswordRequest);
    }

    @Post('/enterprise-user', TrimMiddleware, CheckRoleMiddleware([Roles.enterprise_admin]))
    public async createEnterpriseUser(
        request: WithUserRequest,
    ): Promise<ResponseViewModel<SuccessResponse | null> | null> {
        const validationResult = await super.validate<SuccessResponse>(request, CreateEnterpriseUserValidator);
        if (validationResult) {
            return validationResult;
        }
        const enterpriseUserRequest = super.transform<UserRequest>(request, UserRequest);

        return this.userService.createEnterpriseUser(enterpriseUserRequest);
    }

    @Post('/create', TrimMiddleware, CheckRoleMiddleware([Roles.saas_admin, Roles.enterprise_admin]))
    public async createUser(request: WithUserRequest): Promise<ResponseViewModel<SuccessResponse | null> | null> {
        const validationResult = await super.validate<SuccessResponse>(request, CreateUserValidator);
        if (validationResult) {
            return validationResult;
        }
        const user = request.user;

        const useRequest = super.transform<UserRequest>(request, UserRequest);

        return this.userService.createUser(user, useRequest);
    }

    @Put('/:id/update', CheckRoleMiddleware([Roles.saas_admin, Roles.enterprise_admin]))
    public async update(request: WithUserRequest): Promise<ResponseViewModel<SuccessResponse | null> | null> {
        const validationResult = await super.validate<SuccessResponse>(request, UpdateUserValidator);
        if (validationResult) {
            return validationResult;
        }
        const updateUserRequest = super.transform<UpdateUserRequest>(request, UpdateUserRequest);
        const { user } = request;

        return this.userService.update(user, updateUserRequest);
    }

    @Post('/:id/update-status', CheckRoleMiddleware([Roles.saas_admin, Roles.enterprise_admin]))
    public async updateStatus(request: WithUserRequest): Promise<ResponseViewModel<SuccessResponse>> {
        const { user } = request;
        const requestedUserId = request.params.id || '';

        return this.userService.updateStatus(user, requestedUserId);
    }

    @Post('/supplier-sample-file', CheckRoleMiddleware([Roles.enterprise_admin, Roles.enterprise_user]))
    public exportSampleFile(_: Request, response: Response): Response {
        const headers = Constant.supplierCSVFields;
        const sampleData = Constant.supplierCSVSampleValues;
        const csv = Util.transformToCSV(headers, [sampleData]);
        response.sendRaw(200, csv);

        return response;
    }
}
