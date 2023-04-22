import { Controller, Get, interfaces, Post, Put } from 'inversify-restify-utils';

import {
    ResponseViewModel,
    NotificationServiceContract,
    ApiMiddleware,
    SuccessResponse,
    WithUserRequest,
    EmailTemplateResponse,
    PageRequest,
    PaginatedResponseModel,
    CheckRoleMiddleware,
    Roles,
    AuthMiddleware,
    MailQueueResponse,
    MailQueue,
} from '@negobot/shared/';
import { injectable, inject } from 'inversify';
import { ControllerBase } from './controller-base';

@Controller('/notification', AuthMiddleware)
@injectable()
export class NotificationController extends ControllerBase implements interfaces.Controller {
    public constructor(
        @inject('NotificationService') private readonly notificationService: NotificationServiceContract,
    ) {
        super();
    }

    @Get('/', ApiMiddleware)
    public async get(): Promise<ResponseViewModel<SuccessResponse>> {
        return ResponseViewModel.withSuccess();
    }

    @Post('/', ApiMiddleware)
    public async sendRfqMail(): Promise<ResponseViewModel<SuccessResponse>> {
        return this.notificationService.sendRfqInvitationMail();
    }

    @Get('/bell-icon')
    public async getNotificationMessage(
        request: WithUserRequest,
    ): Promise<ResponseViewModel<PaginatedResponseModel<MailQueueResponse>>> {
        const pageRequest = super.withOutAuthTransform<PageRequest>(request, PageRequest, true);
        const { user } = request;
        return this.notificationService.getNotificationMessage(user, pageRequest);
    }

    @Put('/read-notification', CheckRoleMiddleware([Roles.enterprise_admin, Roles.enterprise_user, Roles.supplier]))
    public async setUnreadNotificationMessage(request: WithUserRequest): Promise<ResponseViewModel<SuccessResponse>> {
        // destructing mail_queue_id if request has body
        const { mail_queue_id, read } = request.body !== undefined && request.body;
        return this.notificationService.setUnreadNotificationMessage(request.user, mail_queue_id, read);
    }

    @Post('/push')
    public async sendDesktopNotification(request: WithUserRequest): Promise<ResponseViewModel<SuccessResponse>> {
        const { user } = request;
        const mailQueues: Promise<MailQueue[]> = this.notificationService.getDesktopNotification(user);
        const mailResults: MailQueue[] = await mailQueues;
        mailResults.map((mail) => {
            (mail.user_ids || []).map((user_id: any) => {
                global.io.to(`user-${user_id}`).emit('notification', { type: 'notification', payload: mail });
            });
            return mail;
        });
        return ResponseViewModel.withSuccess();
    }

    @Post('/template', CheckRoleMiddleware([Roles.enterprise_admin, Roles.enterprise_user]))
    public async getMailTemplate(request: WithUserRequest): Promise<ResponseViewModel<EmailTemplateResponse>> {
        const { template_type, rfq_id } = request.body;

        return this.notificationService.getMailTemplate(template_type, request.user.organisation_id, rfq_id);
    }
}
