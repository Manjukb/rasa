import {
    AuthMiddleware,
    CheckRoleMiddleware,
    EmbedCustomerAuthenticationResponse,
    NegotiationSessionResponse,
    ResponseViewModel,
    Roles,
    SessionRequest,
    SessionServiceContract,
    WithUserRequest,
    SuccessResponse,
    PaginatedResponseModel,
    AgentMakeOfferValidator,
    AgentMakeOfferRequest,
    CreateSessionRequest,
    CustomerSessionValidator,
    NegotiationLightWeightResponse,
} from '@negobot/shared';
import { Controller, Post, interfaces, Get } from 'inversify-restify-utils';

import { ControllerBase } from './controller-base';
import { injectable, inject } from 'inversify';

@Controller('/session')
@injectable()
export class SessionController extends ControllerBase implements interfaces.Controller {
    public constructor(@inject('SessionService') private readonly sessionService: SessionServiceContract) {
        super();
    }

    /**
     * creates a session if none found, returns existing if one is still valid.
     * also creates the channel in twilio and stores it in db
     * @param request { productCode: unique code of product (product_code)}
     * @returns
     */
    @Post(
        '/',
        AuthMiddleware,
        CheckRoleMiddleware([
            Roles.customer,
            Roles.tenant_admin,
            Roles.tenant_user,
            Roles.enterprise_user,
            Roles.enterprise_user,
        ]),
    )
    public async createOrUpdateSession(
        request: WithUserRequest,
    ): Promise<ResponseViewModel<EmbedCustomerAuthenticationResponse | null> | null> {
        const date = new Date();
        const { role } = request.user;
        if (role === Roles.customer) {
            const validationResult = await super.validate<EmbedCustomerAuthenticationResponse>(
                request,
                CustomerSessionValidator,
            );
            if (validationResult) {
                return validationResult;
            }
        }

        const sessionRequest = super.withOutAuthTransform<CreateSessionRequest>(request, CreateSessionRequest);

        const result = await this.sessionService.createOrUpdateSession(request.user, sessionRequest);
        const date2 = new Date();
        const diff = Math.abs(date2.getTime() - date.getTime());
        const a = 0;
        if (a < 1) {
            console.info({
                text: `logging session request ${date2}`,
                diff,
                diffInSec: diff / 1000,
                result: result,
                header: request.headers,
                payload: request.body,
                params: request.params,
                query: request.query,
                url: request.url,
            });
        }

        return result;
    }

    @Post(
        '/:id/accept',
        AuthMiddleware,
        CheckRoleMiddleware([Roles.enterprise_admin, Roles.enterprise_user, Roles.tenant_admin, Roles.tenant_user]),
    )
    public async agentAcceptedOffer(request: WithUserRequest): Promise<ResponseViewModel<SuccessResponse>> {
        const { id: sessionId } = request.params;

        return this.sessionService.agentAcceptOffer(sessionId, request.user);
    }

    @Post(
        '/:id/reject',
        AuthMiddleware,
        CheckRoleMiddleware([Roles.enterprise_admin, Roles.enterprise_user, Roles.tenant_admin, Roles.tenant_user]),
    )
    public async agentRejectedOffer(request: WithUserRequest): Promise<ResponseViewModel<SuccessResponse>> {
        const { id: sessionId } = request.params;

        return this.sessionService.agentRejectOffer(sessionId, request.user);
    }

    @Post(
        '/make-agent-offer',
        AuthMiddleware,
        CheckRoleMiddleware([Roles.enterprise_admin, Roles.enterprise_user, Roles.tenant_admin, Roles.tenant_user]),
    )
    public async agentMakeOffer(request: WithUserRequest): Promise<ResponseViewModel<SuccessResponse>> {
        const validationResult = await super.validate<SuccessResponse>(request, AgentMakeOfferValidator);
        if (validationResult) {
            return validationResult;
        }

        const agentMakeOfferRequest = super.withOutAuthTransform<AgentMakeOfferRequest>(request, AgentMakeOfferRequest);

        return this.sessionService.agentMakeOffer(request.user, agentMakeOfferRequest);
    }

    @Get(
        '/:channelId',
        AuthMiddleware,
        CheckRoleMiddleware([Roles.enterprise_admin, Roles.enterprise_user, Roles.tenant_admin, Roles.tenant_user]),
    )
    public async getSessionById(request: WithUserRequest): Promise<ResponseViewModel<NegotiationLightWeightResponse>> {
        const { channelId } = request.params;

        return this.sessionService.getSessionByChannelId(channelId, request.user);
    }

    @Get(
        '/',
        AuthMiddleware,
        CheckRoleMiddleware([Roles.enterprise_admin, Roles.enterprise_user, Roles.tenant_admin, Roles.tenant_user]),
    )
    public async getSessions(
        request: WithUserRequest,
    ): Promise<ResponseViewModel<PaginatedResponseModel<NegotiationSessionResponse>>> {
        const { organisation_id: organisationId, user_id: userId, tenant_id: tenantId } = request.user;
        const sessionRequest = super.withOutAuthTransform<SessionRequest>(request, SessionRequest, true);

        return this.sessionService.get(sessionRequest, organisationId, userId, tenantId);
    }

    @Get('/donotget')
    public async donotGet(): Promise<ResponseViewModel<SuccessResponse>> {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        this.sessionService.offerAccepted();

        return ResponseViewModel.withSuccess(true);
    }
}
