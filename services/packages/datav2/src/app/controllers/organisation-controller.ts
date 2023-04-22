import { Controller, Post, interfaces, Get, Put } from 'inversify-restify-utils';

import {
    AuthMiddleware,
    BotResponse,
    BotServiceContract,
    CheckRoleMiddleware,
    OrganisationSupplierResponse,
    PaginatedResponseModel,
    PaginatorRequest,
    TrimMiddleware,
    SupplierOrganisationServiceContract,
} from '@negobot/shared/';
import { ControllerBase } from './controller-base';
import { OrganisationServiceContract } from '@negobot/shared/';
import { ResponseViewModel } from '@negobot/shared/';
import { WithUserRequest } from '@negobot/shared/';
import { inject, injectable } from 'inversify';
import {
    CreateOrganisationValidator,
    CreateOrganisationWithAdminValidator,
    UpdateOrganisationValidator,
} from '@negobot/shared/';
import { OrganisationResponse, SuccessResponse, UserResponse } from '@negobot/shared/';
import { OrganisationRequest, OrganisationWithAdminRequest, UpdateOrganisationRequest } from '@negobot/shared/';
import { Roles } from '@negobot/shared/';

@Controller('/organisation', AuthMiddleware)
@injectable()
export class OrganisationController extends ControllerBase implements interfaces.Controller {
    public constructor(
        @inject('OrganisationService') private readonly organisationService: OrganisationServiceContract,
        @inject('BotService') private readonly botService: BotServiceContract,
        @inject('SupplierOrganisationService')
        private readonly supplierOrganisationService: SupplierOrganisationServiceContract,
    ) {
        super();
    }

    @Get('/')
    public async get(request: WithUserRequest): Promise<ResponseViewModel<OrganisationResponse>> {
        const { user } = request;

        return this.organisationService.getLightWeight(user.organisation_id);
    }

    @Get('/all', CheckRoleMiddleware([Roles.super_admin]))
    public async getAll(
        request: WithUserRequest,
    ): Promise<ResponseViewModel<PaginatedResponseModel<OrganisationResponse>>> {
        const searchRequest = super.withOutAuthTransform<PaginatorRequest>(request, PaginatorRequest, true);
        return await this.organisationService.getLightWeightList(searchRequest);
    }

    @Post('/', TrimMiddleware, CheckRoleMiddleware([Roles.super_admin]))
    public async create(request: WithUserRequest): Promise<ResponseViewModel<SuccessResponse | null> | null> {
        const validationResult = await super.validate<SuccessResponse>(request, CreateOrganisationWithAdminValidator);
        if (validationResult) {
            return validationResult;
        }
        const organisationRequest = super.transform<OrganisationWithAdminRequest>(
            request,
            OrganisationWithAdminRequest,
        );

        return this.organisationService.create(organisationRequest);
    }

    @Post('/old', TrimMiddleware, CheckRoleMiddleware([Roles.super_admin]))
    public async createOld(request: WithUserRequest): Promise<ResponseViewModel<SuccessResponse | null> | null> {
        const validationResult = await super.validate<SuccessResponse>(request, CreateOrganisationValidator);
        if (validationResult) {
            return validationResult;
        }
        const organisationRequest = super.transform<OrganisationRequest>(request, OrganisationRequest);

        return this.organisationService.createOld(organisationRequest);
    }

    @Put('/:id', TrimMiddleware, CheckRoleMiddleware([Roles.super_admin, Roles.enterprise_admin, Roles.saas_admin]))
    public async update(request: WithUserRequest): Promise<ResponseViewModel<SuccessResponse | null> | null> {
        const organisationId = request.params.id;
        const validationResult = await super.validate<SuccessResponse>(request, UpdateOrganisationValidator);
        if (validationResult) {
            return validationResult;
        }
        const organisationRequest = super.transform<UpdateOrganisationRequest>(request, UpdateOrganisationRequest);

        return this.organisationService.update(organisationId, organisationRequest);
    }

    @Get('/users', CheckRoleMiddleware([Roles.super_admin, Roles.org_admin, Roles.saas_admin, Roles.enterprise_admin]))
    public async getOrganisationUsers(request: WithUserRequest): Promise<ResponseViewModel<UserResponse[]>> {
        const user = request.user;
        const orgId = user.organisation_id;

        return await this.organisationService.getOrganisationUsers(orgId);
    }

    @Get(
        '/:organisationId/users',
        CheckRoleMiddleware([Roles.super_admin, Roles.org_admin, Roles.saas_admin, Roles.enterprise_admin]),
    )
    public async getOrgUsersByOrgId(request: WithUserRequest): Promise<ResponseViewModel<UserResponse[]>> {
        const { organisationId } = request.params;

        return await this.organisationService.getOrganisationUsers(organisationId);
    }

    @Get(
        '/:organisationId/bots',
        CheckRoleMiddleware([
            Roles.super_admin,
            Roles.saas_admin,
            Roles.enterprise_admin,
            Roles.enterprise_user,
            Roles.tenant_admin,
        ]),
    )
    public async getOrganisationBots(request: WithUserRequest): Promise<ResponseViewModel<BotResponse[]>> {
        const { organisationId } = request.params;
        const { tenant_id: tenantId } = request.user;

        return await this.botService.getOrganisationBots(organisationId, tenantId);
    }

    @Get('/:organisationId')
    public async getById(request: WithUserRequest): Promise<ResponseViewModel<OrganisationResponse>> {
        const { organisationId } = request.params;

        return await this.organisationService.getLightWeight(organisationId);
    }

    @Get('/suppliers/:categoryId')
    public async getOrganisationSupplier(
        request: WithUserRequest,
    ): Promise<ResponseViewModel<PaginatedResponseModel<OrganisationSupplierResponse>>> {
        const { organisation_id } = request.user;
        const { categoryId } = request.params;
        let { productIds } = request.query;
        if (productIds) {
            productIds = productIds.split(',');
        }
        const searchRequest = super.withOutAuthTransform<PaginatorRequest>(request, PaginatorRequest, true);

        return await this.supplierOrganisationService.getOrganisationSupplier(
            organisation_id,
            searchRequest,
            categoryId,
            productIds,
        );
    }
}
