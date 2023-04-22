import { Controller, Delete, Get, interfaces, Put, Post } from 'inversify-restify-utils';

import {
    AuthMiddleware,
    CheckRoleMiddleware,
    WithUserRequest,
    RfqRequest,
    RfqServiceContract,
    RfqResponse,
    RfqSearchRequest,
    PaginatedResponseModel,
    SuccessResponse,
    RfqValidator,
    RfqProcurementNegotiationServiceContract,
} from '@negobot/shared/';
import { ControllerBase } from './controller-base';
import { ResponseViewModel } from '@negobot/shared/';
import { injectable, inject } from 'inversify';
import { Roles } from '@negobot/shared/';

@Controller('/rfq', AuthMiddleware)
@injectable()
export class RfqController extends ControllerBase implements interfaces.Controller {
    public constructor(
        @inject('RfqService') private readonly rfqService: RfqServiceContract,
        @inject('RfqProcurementNegotiationService')
        private readonly rfqProcurementNegotiationService: RfqProcurementNegotiationServiceContract,
    ) {
        super();
    }

    @Put('/update', CheckRoleMiddleware([Roles.enterprise_admin]))
    public async update(request: WithUserRequest): Promise<ResponseViewModel<RfqResponse | null> | null> {
        request.body.negotiation_process = request.body.negotiation_process || null;
        const validationResult = await super.validate<RfqResponse>(request, RfqValidator);
        if (validationResult) {
            return validationResult;
        }
        const rfqRequest = super.transform<RfqRequest>(request, RfqRequest);

        return this.rfqService.update(rfqRequest, request.user);
    }

    @Get('/', CheckRoleMiddleware([Roles.enterprise_admin, Roles.enterprise_user, Roles.supplier]))
    public async get(request: WithUserRequest): Promise<ResponseViewModel<PaginatedResponseModel<RfqResponse>>> {
        const searchRequest = super.withOutAuthTransform<RfqSearchRequest>(request, RfqSearchRequest, true);

        return this.rfqService.getAll(request.user, searchRequest);
    }

    @Get('/:id', CheckRoleMiddleware([Roles.enterprise_admin, Roles.enterprise_user, Roles.supplier]))
    public async getById(request: WithUserRequest): Promise<ResponseViewModel<RfqResponse>> {
        const { id } = request.params;

        return this.rfqService.getById(id, request.user);
    }

    @Delete('/:id', CheckRoleMiddleware([Roles.enterprise_admin, Roles.enterprise_user]))
    public async delete(request: WithUserRequest): Promise<ResponseViewModel<SuccessResponse>> {
        const { id } = request.params;

        return this.rfqService.delete(id, request.user);
    }

    @Post('/checkRfqStatus')
    public async checkRfqStatus(): Promise<ResponseViewModel<SuccessResponse>> {
        return this.rfqProcurementNegotiationService.checkRfqStatus();
    }
}
