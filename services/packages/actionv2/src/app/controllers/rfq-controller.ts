import { Controller, Get, Post, interfaces } from 'inversify-restify-utils';
import {
    AuthMiddleware,
    CheckRoleMiddleware,
    ResponseViewModel,
    Roles,
    SuccessResponse,
    WithUserRequest,
    RfqNegotiationServiceContract,
    SupplierOfferResponse,
    RfqNegotiationValidator,
    CommentResponse,
    RfqCommentValidator,
    RfqNegotiationActionsServiceContract,
    RfqProcurementNegotiationServiceContract,
} from '@negobot/shared/';

import { ControllerBase } from './controller-base';
import { injectable, inject } from 'inversify';
@Controller('/rfq', AuthMiddleware)
@injectable()
export class RfqController extends ControllerBase implements interfaces.Controller {
    public constructor(
        @inject('RfqNegotiationService') private readonly rfqNegotiationService: RfqNegotiationServiceContract,
        @inject('RfqNegotiationActionsService')
        private readonly rfqActionNegotiationService: RfqNegotiationActionsServiceContract,
        @inject('RfqProcurementNegotiationService')
        private readonly rfqProcurementNegotiationService: RfqProcurementNegotiationServiceContract,
    ) {
        super();
    }

    @Get('/:rfqId')
    public async get(request: WithUserRequest): Promise<ResponseViewModel<Record<string, unknown>>> {
        const rfqId: string = request.params.rfqId;
        if (!rfqId) {
            return ResponseViewModel.withError('rfq-id is missing');
        }

        return await this.rfqNegotiationService.getById(rfqId, request.user);
    }

    @Post('/:rfqId/award', AuthMiddleware, CheckRoleMiddleware([Roles.enterprise_admin, Roles.enterprise_user]))
    public async awardRfq(request: WithUserRequest): Promise<ResponseViewModel<SuccessResponse>> {
        const rfqId: string = request.params.rfqId;
        if (!rfqId) {
            return ResponseViewModel.withError('rfq-id is missing');
        }
        const { supplier_id } = request.body;

        return await this.rfqActionNegotiationService.awardRfq(rfqId, supplier_id, request.user);
    }

    @Post('/:rfqId/accept', AuthMiddleware, CheckRoleMiddleware([Roles.supplier]))
    public async acceptRfq(request: WithUserRequest): Promise<ResponseViewModel<SuccessResponse>> {
        const rfqId: string = request.params.rfqId;
        if (!rfqId) {
            return ResponseViewModel.withError('rfq-id is missing');
        }
        const { supplier_id } = request.body;

        return await this.rfqActionNegotiationService.acceptRfq(rfqId, supplier_id, request.user);
    }

    @Post('/:rfqId/reject', AuthMiddleware, CheckRoleMiddleware([Roles.supplier]))
    public async rejectRfq(request: WithUserRequest): Promise<ResponseViewModel<SuccessResponse>> {
        const rfqId: string = request.params.rfqId;
        if (!rfqId) {
            return ResponseViewModel.withError('rfq-id is missing');
        }
        const { supplier_id, reason } = request.body;
        return await this.rfqActionNegotiationService.rejectRfq(rfqId, supplier_id, reason, request.user);
    }

    @Post('/:rfqId', AuthMiddleware, CheckRoleMiddleware([Roles.supplier]))
    public async submitBid(
        request: WithUserRequest,
    ): Promise<ResponseViewModel<SuccessResponse | SupplierOfferResponse>> {
        const validationResult = await super.validate<SupplierOfferResponse>(request, RfqNegotiationValidator);
        if (validationResult) {
            return validationResult;
        }
        const rfqId: string = request.params.rfqId;
        if (!rfqId) {
            return ResponseViewModel.withError('rfq-id is missing');
        }
        return await this.rfqProcurementNegotiationService.submitBid(rfqId, request.body, request.user);
    }

    @Post('/:rfqId/exit', AuthMiddleware, CheckRoleMiddleware([Roles.enterprise_admin]))
    public async exitRfq(request: WithUserRequest): Promise<ResponseViewModel<SuccessResponse>> {
        const rfqId: string = request.params.rfqId;
        if (!rfqId) {
            return ResponseViewModel.withError('rfq-id is missing');
        }
        return await this.rfqActionNegotiationService.exitRfq(rfqId, request.user);
    }

    @Post('/copilot/:rfqId', AuthMiddleware, CheckRoleMiddleware([Roles.enterprise_admin]))
    public async coPilotSubmitBid(
        request: WithUserRequest,
    ): Promise<ResponseViewModel<SuccessResponse | SupplierOfferResponse>> {
        const rfqId: string = request.params.rfqId;
        if (!rfqId) {
            return ResponseViewModel.withError('rfq-id is missing');
        }
        return await this.rfqProcurementNegotiationService.coPilotSubmitBid(rfqId, request.body.payload, request.user);
    }

    @Post('/clone/:rfqId', AuthMiddleware, CheckRoleMiddleware([Roles.enterprise_admin]))
    public async cloneRfq(
        request: WithUserRequest,
    ): Promise<ResponseViewModel<SuccessResponse | SupplierOfferResponse>> {
        const rfqId: string = request.params.rfqId;
        if (!rfqId) {
            return ResponseViewModel.withError('rfq-id is missing');
        }
        return await this.rfqActionNegotiationService.cloneRfq(rfqId, request.user);
    }

    @Post(
        '/:rfqId/comment',
        AuthMiddleware,
        CheckRoleMiddleware([Roles.enterprise_admin, Roles.enterprise_user, Roles.supplier]),
    )
    public async addComment(request: WithUserRequest): Promise<ResponseViewModel<SuccessResponse | CommentResponse>> {
        const validationResult = await super.validate<CommentResponse>(request, RfqCommentValidator);
        if (validationResult) {
            return validationResult;
        }
        const rfqId: string = request.params.rfqId;
        if (!rfqId) {
            return ResponseViewModel.withError('rfq-id is missing');
        }

        return await this.rfqActionNegotiationService.addComment(rfqId, request.body, request.user);
    }
}
