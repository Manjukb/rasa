import { Controller, interfaces, Post, Get } from 'inversify-restify-utils';

import {
    SuccessResponse,
    ApiMiddleware,
    NegotiationServiceContract,
    AuthMiddleware,
    WithUserRequest,
    SearchRequest,
    NegotiationSession,
} from '@negobot/shared/';
import { ControllerBase } from './controller-base';
import { ResponseViewModel } from '@negobot/shared/';
import { inject, injectable } from 'inversify';

@Controller('/session')
@injectable()
export class NegotiationSessionController extends ControllerBase implements interfaces.Controller {
    public constructor(@inject('NegotiationService') private readonly negotiationService: NegotiationServiceContract) {
        super();
    }

    @Post('/mark-as-abandoned', ApiMiddleware)
    public async abandoned(): Promise<ResponseViewModel<SuccessResponse | null> | null> {
        return this.negotiationService.markAsAbandoned();
    }

    @Get('/', AuthMiddleware)
    public async getSessions(request: WithUserRequest): Promise<ResponseViewModel<NegotiationSession[]>> {
        const user = request.user;
        const searchRequest = super.queryTransform<SearchRequest>(request, SearchRequest);
        return this.negotiationService.getSessions(user, searchRequest);
    }
}
