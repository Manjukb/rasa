import {
    EmailTemplateResponse,
    MailQueueMessageType,
    MetaInfoMessageType,
    UserServiceContract,
    NotificationMailTemplateServiceContract,
    ResponseViewModel,
    RfqResponse,
    SuccessResponse,
    Util,
    MailCreatedByInfo,
    ReadUnreadUserIds,
} from '..';

import { MailQueue } from '../database/models';
import { getRepository } from 'typeorm';
import { injectable, inject } from 'inversify';
export interface RfqNotificationServiceContract {
    save(
        rfqId: string,
        message: MailQueueMessageType,
        type: string,
        sendAt: Date,
        mailCreatedBy?: MailCreatedByInfo,
        userIds?: ReadUnreadUserIds[],
        metaInfo?: MetaInfoMessageType,
    ): Promise<ResponseViewModel<SuccessResponse>>;
    setEmailTemplateByDeadline(
        rfqData: RfqResponse,
        type: string,
        orgId: string,
        deadline: Date,
    ): Promise<ResponseViewModel<EmailTemplateResponse>>;
    setEmailTemplateForRfqExit(
        rfqData: RfqResponse,
        type: string,
        orgId: string,
    ): Promise<ResponseViewModel<EmailTemplateResponse>>;
    setEmailTemplateForCopilotOfferSubmittedAndDeadline(
        rfqData: RfqResponse,
        type: string,
        orgId: string,
        coPilotTotal: string,
        coPilotDeadline: Date,
    ): Promise<ResponseViewModel<EmailTemplateResponse>>;
    setEmailTemplateForSubmittedSupplierOffer(
        rfqData: RfqResponse,
        type: string,
        orgId: string,
        supplierId: string,
    ): Promise<ResponseViewModel<EmailTemplateResponse>>;
    setEmailTemplateForPMoNSupplierOffer(
        rfqData: RfqResponse,
        type: string,
        orgId: string,
        supplierId: string,
        round?: number,
    ): Promise<ResponseViewModel<EmailTemplateResponse>>;
    setEmailTemplateForPMoNSupplierAwardRejectOrAccept(
        rfqData: RfqResponse,
        type: string,
        orgId: string,
        supplierId: string,
    ): Promise<ResponseViewModel<EmailTemplateResponse>>;
    setEmailTemplateForRoundComplete(
        rfqData: RfqResponse,
        type: string,
        orgId: string,
        deadline: Date,
        botTotal?: string,
    ): Promise<ResponseViewModel<EmailTemplateResponse>>;
    setEmailTemplateForPMonAllSupplierSubmitForRound(
        rfqData: RfqResponse,
        type: string,
        orgId: string,
        coPilotDeadline: Date,
        round: number,
    ): Promise<ResponseViewModel<EmailTemplateResponse>>;
    setEmailTemplateForPMonFinalRoundComplete(
        rfqData: RfqResponse,
        type: string,
        orgId: string,
        round: number,
    ): Promise<ResponseViewModel<EmailTemplateResponse>>;
    setEmailTemplateForPMonAutoAcceptScoreReached(
        rfqData: RfqResponse,
        type: string,
        orgId: string,
    ): Promise<ResponseViewModel<EmailTemplateResponse>>;
    setEmailTemplateForAward(
        rfqData: RfqResponse,
        type: string,
        orgId: string,
    ): Promise<ResponseViewModel<EmailTemplateResponse>>;
}

@injectable()
export class RfqNotificationService implements RfqNotificationServiceContract {
    public constructor(
        @inject('UserService') private readonly userService: UserServiceContract,
        @inject('NotificationMailTemplateService')
        private readonly notificationMailTemplateService: NotificationMailTemplateServiceContract,
    ) {}

    public async save(
        rfqId: string,
        message: MailQueueMessageType,
        type: string,
        sendAt: Date,
        mailCreatedBy?: MailCreatedByInfo,
        userIds?: ReadUnreadUserIds[],
        metaInfo?: MetaInfoMessageType,
    ): Promise<ResponseViewModel<SuccessResponse>> {
        await this.deleteByTemplateType(rfqId, type, sendAt);

        const queue = new MailQueue();
        queue.id = Util.guid();
        queue.rfq_id = rfqId;
        queue.message = message;
        queue.type = type;
        queue.send_at = sendAt;
        queue.created_by = mailCreatedBy;
        queue.user_ids = userIds;
        metaInfo && (queue.meta_info = metaInfo);
        await getRepository(MailQueue).save(queue);

        return ResponseViewModel.withSuccess();
    }

    private async deleteByTemplateType(
        rfqId: string,
        type: string,
        sendAt: Date,
    ): Promise<ResponseViewModel<SuccessResponse>> {
        await getRepository(MailQueue)
            .createQueryBuilder()
            .delete()
            .from(MailQueue)
            .where('mail_queue.rfq_id = :rfqId', { rfqId })
            .andWhere('mail_queue.type = :type', { type })
            .andWhere('mail_queue.send_at = :sendAt', { sendAt })
            .execute();

        return ResponseViewModel.withSuccess();
    }

    public async setEmailTemplateByDeadline(
        rfqData: RfqResponse,
        type: string,
        orgId: string,
        deadline: Date,
    ): Promise<ResponseViewModel<EmailTemplateResponse>> {
        const template = await this.notificationMailTemplateService.getEmailTemplateResponse(type, orgId);
        this.notificationMailTemplateService.checkEmailTemplateAndRfq(template, rfqData);

        const emailTemplate = await this.notificationMailTemplateService.replaceTemplateParameter(
            template,
            rfqData,
            deadline,
        );

        return ResponseViewModel.with(emailTemplate);
    }

    public async setEmailTemplateForRfqExit(
        rfqData: RfqResponse,
        type: string,
        orgId: string,
    ): Promise<ResponseViewModel<EmailTemplateResponse>> {
        const template = await this.notificationMailTemplateService.getEmailTemplateResponse(type, orgId);
        this.notificationMailTemplateService.checkEmailTemplateAndRfq(template, rfqData);

        const emailTemplate = await this.notificationMailTemplateService.replaceTemplateParameter(template, rfqData);

        return ResponseViewModel.with(emailTemplate);
    }

    public async setEmailTemplateForCopilotOfferSubmittedAndDeadline(
        rfqData: RfqResponse,
        type: string,
        orgId: string,
        coPilotTotal: string,
        coPilotDeadline: Date,
    ): Promise<ResponseViewModel<EmailTemplateResponse>> {
        const template = await this.notificationMailTemplateService.getEmailTemplateResponse(type, orgId);
        this.notificationMailTemplateService.checkEmailTemplateAndRfq(template, rfqData);

        const emailTemplate = await this.notificationMailTemplateService.replaceTemplateParameter(
            template,
            rfqData,
            null,
            null,
            null,
            null,
            coPilotDeadline,
            coPilotTotal,
        );

        return ResponseViewModel.with(emailTemplate);
    }

    public async setEmailTemplateForRoundComplete(
        rfqData: RfqResponse,
        type: string,
        orgId: string,
        deadline: Date,
        botTotal?: string,
    ): Promise<ResponseViewModel<EmailTemplateResponse>> {
        const template = await this.notificationMailTemplateService.getEmailTemplateResponse(type, orgId);
        this.notificationMailTemplateService.checkEmailTemplateAndRfq(template, rfqData);

        const emailTemplate = await this.notificationMailTemplateService.replaceTemplateParameter(
            template,
            rfqData,
            deadline,
            null,
            null,
            null,
            null,
            null,
            botTotal,
        );

        return ResponseViewModel.with(emailTemplate);
    }

    public async setEmailTemplateForPMonAllSupplierSubmitForRound(
        rfqData: RfqResponse,
        type: string,
        orgId: string,
        coPilotDeadline: Date,
        round: number,
    ): Promise<ResponseViewModel<EmailTemplateResponse>> {
        const template = await this.notificationMailTemplateService.getEmailTemplateResponse(type, orgId);
        this.notificationMailTemplateService.checkEmailTemplateAndRfq(template, rfqData);

        const rfqProcurementManager = (await this.userService.getUser(rfqData.updated_by)).data;

        const emailTemplate = await this.notificationMailTemplateService.replaceTemplateParameter(
            template,
            rfqData,
            null,
            null,
            rfqProcurementManager,
            round,
            coPilotDeadline,
        );

        return ResponseViewModel.with(emailTemplate);
    }

    public async setEmailTemplateForPMonFinalRoundComplete(
        rfqData: RfqResponse,
        type: string,
        orgId: string,
        round: number,
    ): Promise<ResponseViewModel<EmailTemplateResponse>> {
        const template = await this.notificationMailTemplateService.getEmailTemplateResponse(type, orgId);
        this.notificationMailTemplateService.checkEmailTemplateAndRfq(template, rfqData);

        const rfqProcurementManager = (await this.userService.getUser(rfqData.updated_by)).data;

        const emailTemplate = await this.notificationMailTemplateService.replaceTemplateParameter(
            template,
            rfqData,
            null,
            null,
            rfqProcurementManager,
            round,
        );

        return ResponseViewModel.with(emailTemplate);
    }

    public async setEmailTemplateForPMonAutoAcceptScoreReached(
        rfqData: RfqResponse,
        type: string,
        orgId: string,
    ): Promise<ResponseViewModel<EmailTemplateResponse>> {
        const template = await this.notificationMailTemplateService.getEmailTemplateResponse(type, orgId);
        this.notificationMailTemplateService.checkEmailTemplateAndRfq(template, rfqData);

        const rfqProcurementManager = (await this.userService.getUser(rfqData.updated_by)).data;

        const emailTemplate = await this.notificationMailTemplateService.replaceTemplateParameter(
            template,
            rfqData,
            null,
            null,
            rfqProcurementManager,
        );

        return ResponseViewModel.with(emailTemplate);
    }

    public async setEmailTemplateForAward(
        rfqData: RfqResponse,
        type: string,
        orgId: string,
    ): Promise<ResponseViewModel<EmailTemplateResponse>> {
        const template = await this.notificationMailTemplateService.getEmailTemplateResponse(type, orgId);
        this.notificationMailTemplateService.checkEmailTemplateAndRfq(template, rfqData);

        const emailTemplate = await this.notificationMailTemplateService.replaceTemplateParameter(template, rfqData);

        return ResponseViewModel.with(emailTemplate);
    }

    public async setEmailTemplateForSubmittedSupplierOffer(
        rfqData: RfqResponse,
        type: string,
        orgId: string,
        supplierId: string,
    ): Promise<ResponseViewModel<EmailTemplateResponse>> {
        const template = await this.notificationMailTemplateService.getEmailTemplateResponse(type, orgId);
        this.notificationMailTemplateService.checkEmailTemplateAndRfq(template, rfqData);

        const supplierUsers = await this.userService.getBySupplierIds([supplierId]);

        const emailTemplate = await this.notificationMailTemplateService.replaceTemplateParameter(
            template,
            rfqData,
            null,
            supplierUsers,
        );

        return ResponseViewModel.with(emailTemplate);
    }

    public async setEmailTemplateForPMoNSupplierOffer(
        rfqData: RfqResponse,
        type: string,
        orgId: string,
        supplierId: string,
        round: number,
    ): Promise<ResponseViewModel<EmailTemplateResponse>> {
        const template = await this.notificationMailTemplateService.getEmailTemplateResponse(type, orgId);
        this.notificationMailTemplateService.checkEmailTemplateAndRfq(template, rfqData);

        const supplierUsers = await this.userService.getBySupplierIds([supplierId]);
        const rfqProcurementManager = (await this.userService.getUser(rfqData.updated_by)).data;

        const emailTemplate = await this.notificationMailTemplateService.replaceTemplateParameter(
            template,
            rfqData,
            null,
            supplierUsers,
            rfqProcurementManager,
            round,
        );

        return ResponseViewModel.with(emailTemplate);
    }

    public async setEmailTemplateForPMoNSupplierAwardRejectOrAccept(
        rfqData: RfqResponse,
        type: string,
        orgId: string,
        supplierId: string,
    ): Promise<ResponseViewModel<EmailTemplateResponse>> {
        const template = await this.notificationMailTemplateService.getEmailTemplateResponse(type, orgId);
        this.notificationMailTemplateService.checkEmailTemplateAndRfq(template, rfqData);

        const supplierUsers = await this.userService.getBySupplierIds([supplierId]);
        const rfqProcurementManager = (await this.userService.getUser(rfqData.updated_by)).data;

        const emailTemplate = await this.notificationMailTemplateService.replaceTemplateParameter(
            template,
            rfqData,
            null,
            supplierUsers,
            rfqProcurementManager,
        );

        return ResponseViewModel.with(emailTemplate);
    }
}
