import { Controller, Get, Post, interfaces } from 'inversify-restify-utils';
import {
    ActionServiceContract,
    AuthMiddleware,
    CheckRoleMiddleware,
    ResponseViewModel,
    Roles,
    SuccessResponse,
    WithUserRequest,
} from '@negobot/shared/';

import { ControllerBase } from './controller-base';
import { Request } from 'restify';
import { injectable, inject } from 'inversify';
@Controller('')
@injectable()
export class ActionController extends ControllerBase implements interfaces.Controller {
    public constructor(@inject('ActionService') private readonly actionService: ActionServiceContract) {
        super();
    }

    @Get('/version')
    public async version(): Promise<ResponseViewModel<string>> {
        const response = new ResponseViewModel<string>();
        response.data = 'hello world 5.6.7 fixing issues for Negobot';

        return response;
    }

    @Post(
        '/:channelId/hand-over-to-bot',
        AuthMiddleware,
        CheckRoleMiddleware([Roles.enterprise_admin, Roles.enterprise_user, Roles.tenant_admin, Roles.tenant_user]),
    )
    public async handOverToBot(request: WithUserRequest): Promise<ResponseViewModel<SuccessResponse>> {
        const { channelId } = request.params;
        const response = await this.actionService.handOverToBot(channelId, request.user);

        return response;
    }

    @Post('/')
    public async negotiate(request: Request): Promise<ResponseViewModel<SuccessResponse>> {
        console.info('negotiate from twilio received at', JSON.stringify(request.body));
        console.info('negotiate from twilio received at', request.headers);
        console.info('negotiate from twilio received at', request.getContentType());

        const response = await this.actionService.negotiate(request);

        return response;
    }
}
