import { injectable, inject } from 'inversify';
import {
    Constant,
    EmailTemplateResponse,
    env,
    MailQueueResponse,
    PageRequest,
    PaginatedResponseModel,
    RequestUserResponse,
    ResponseViewModel,
    SuccessResponse,
} from '..';
import { getRepository } from 'typeorm';
import { MailQueue, Rfq, Organisation, Negotiation } from '../database/models';
import {
    CircularDependenciesResolverServiceContract,
    MailServiceContract,
    OrganisationServiceContract,
    RfqServiceContract,
    RfqSupplierServiceContract,
    UserServiceContract,
    NotificationMailTemplateServiceContract,
    SupplierServiceContract,
} from './';
import * as moment from 'moment-timezone';
import { TemplateType } from '../enum/template-type';
import { RfqStatus } from '../enum/rfq-status';
import { MailQueueResponseTransformer } from '../transformer/mail-queue-transformer';
import { RfqResponse } from '../viewmodels/response';
import { Roles } from '../enum';
export interface NotificationServiceContract {
    get(rfqId: string): Promise<ResponseViewModel<MailQueue>>;
    sendRfqInvitationMail(): Promise<ResponseViewModel<SuccessResponse>>;
    sendRfqDeadlineApproachingMail(): Promise<ResponseViewModel<SuccessResponse>>;
    sendRfqCopilotDeadlineApproachingMail(): Promise<ResponseViewModel<SuccessResponse>>;
    sendRfqCopilotOfferMail(): Promise<ResponseViewModel<SuccessResponse>>;
    sendRfqAwardWonMail(): Promise<ResponseViewModel<SuccessResponse>>;
    sendRfqAwardLostMail(): Promise<ResponseViewModel<SuccessResponse>>;
    sendSupplierOfferSubmitted(): Promise<ResponseViewModel<SuccessResponse>>;
    sendSupplierOfferSubmittedToPM(): Promise<ResponseViewModel<SuccessResponse>>;
    sendAllSupplierOfferForRoundSubmittedToPM(): Promise<ResponseViewModel<SuccessResponse>>;
    sendFinalRoundCompletedToPM(): Promise<ResponseViewModel<SuccessResponse>>;
    sendAutoAcceptReachedToPM(): Promise<ResponseViewModel<SuccessResponse>>;
    sendAwardRejectedToPM(): Promise<ResponseViewModel<SuccessResponse>>;
    sendAwardAcceptedToPM(): Promise<ResponseViewModel<SuccessResponse>>;
    sendRfqRoundCompletedMail(): Promise<ResponseViewModel<SuccessResponse>>;
    sendRfqAwardPendingMail(): Promise<ResponseViewModel<SuccessResponse>>;
    sendRfqExitMail(): Promise<ResponseViewModel<SuccessResponse>>;
    getNotificationMessage(
        user: RequestUserResponse,
        pageRequest: PageRequest,
    ): Promise<ResponseViewModel<PaginatedResponseModel<MailQueueResponse>>>;
    setUnreadNotificationMessage(
        user: RequestUserResponse,
        mailQueueId?: string[],
        read?: boolean,
    ): Promise<ResponseViewModel<SuccessResponse>>;
    getDesktopNotification(user: RequestUserResponse): Promise<MailQueue[]>;
    getMailTemplate(
        type: string,
        organisationId: string,
        rfqId: string,
    ): Promise<ResponseViewModel<EmailTemplateResponse>>;
}

@injectable()
export class NotificationService implements NotificationServiceContract {
    public constructor(
        @inject('RfqService') private readonly rfqService: RfqServiceContract,
        @inject('RfqSupplierService') private readonly rfqSupplierService: RfqSupplierServiceContract,
        @inject('CircularDependenciesResolverService')
        private readonly circularDependenciesResolverService: CircularDependenciesResolverServiceContract,
        @inject('OrganisationService') private readonly organisationService: OrganisationServiceContract,
        @inject('UserService') private readonly userService: UserServiceContract,
        @inject('SupplierService') private readonly supplierService: SupplierServiceContract,
        @inject('MailService') private readonly mailService: MailServiceContract,
        @inject('NotificationMailTemplateService')
        private readonly notificationMailTemplateService: NotificationMailTemplateServiceContract,
    ) {}

    public async getMailTemplate(
        type: string,
        organisationId: string,
        rfqId: string,
    ): Promise<ResponseViewModel<EmailTemplateResponse>> {
        const rfq = (await this.rfqService.getById(rfqId)).data;
        if (!rfq) {
            return ResponseViewModel.withError('invalid rfq-id');
        }
        // Validation to check each required-field is saved or not
        if (rfq.items.length === 0) {
            return ResponseViewModel.withError('Manage Categories and Products is a required section');
        }
        if (rfq.parameter === null) {
            return ResponseViewModel.withError('Manage negotiation strategy is a required section');
        }
        if (rfq.negotiation_process === null) {
            return ResponseViewModel.withError('Manage negotiation process is a required section');
        }
        if (rfq.suppliers.length === 0) {
            return ResponseViewModel.withError('Select supplier is a required section');
        }

        const template = await this.notificationMailTemplateService.getEmailTemplateResponse(type, organisationId);
        this.notificationMailTemplateService.checkEmailTemplateAndRfq(template, rfq);
        const rfqSuppliersEmail = rfq.suppliers.map((rfqSupplier) => rfqSupplier.supplier.email);

        const emailTemplate = await this.notificationMailTemplateService.replaceTemplateParameter(template, rfq);
        emailTemplate.to = rfqSuppliersEmail.toString();

        return ResponseViewModel.with(emailTemplate);
    }

    public async get(rfqId: string): Promise<ResponseViewModel<MailQueue>> {
        const queue = await getRepository(MailQueue).findOne({ rfq_id: rfqId });
        if (queue) {
            return ResponseViewModel.with(queue);
        }

        return ResponseViewModel.withError('No message stored with passed RFQ Id');
    }

    public async sendRfqInvitationMail(): Promise<ResponseViewModel<SuccessResponse>> {
        const queues = await this.getMailQueuesByTemplateType(TemplateType.RFQOpened);

        const rfqIds = [...new Set(queues.map((queue) => queue.rfq_id))];
        const rfqs = await this.circularDependenciesResolverService.getRfqsByIds(rfqIds);
        const organisationIds = [...new Set(rfqs.map((rfq) => rfq.organisation_id))];
        const organisations = await this.organisationService.getByOrgIds(organisationIds);
        const validRfqIds = this.getRfqIdsToSendMail(rfqs, organisations);

        const rfqSuppliers = await this.rfqSupplierService.getSuppliers(validRfqIds);
        const suppliersIdsToWhomSendMail = rfqSuppliers
            .filter((rfqSupplier) => rfqSupplier.send_mail === true)
            .map((rfqSupplier) => rfqSupplier.supplier_id);

        const supplierUsers = await this.userService.getBySupplierIds(suppliersIdsToWhomSendMail);
        const indexedSuppliers: { [key: string]: string } = {};
        supplierUsers.forEach((user) => {
            indexedSuppliers[user.supplier_id] = user.email;
        });

        Promise.all(
            validRfqIds.map(
                async (rfqId: string): Promise<void> => {
                    const message = queues.find((queue) => queue.rfq_id === rfqId).message;
                    const supplierSupplierIds = rfqSuppliers
                        .filter((rfqSupplier) => rfqSupplier.rfq_id === rfqId && rfqSupplier.send_mail === true)
                        .map((rfqSupplier) => rfqSupplier.supplier_id);
                    const emails: string[] = [];
                    supplierSupplierIds.forEach((supplierSupplierId) => {
                        if (indexedSuppliers[supplierSupplierId]) {
                            emails.push(indexedSuppliers[supplierSupplierId]);
                        }
                    });
                    await this.mailService.sendRfqMail(emails, message);
                    await this.setSentTime(rfqId, TemplateType.RFQOpened);
                },
            ),
        );

        return ResponseViewModel.withSuccess();
    }

    public async sendRfqDeadlineApproachingMail(): Promise<ResponseViewModel<SuccessResponse>> {
        return await this.sendRfqDeadlineMail(TemplateType.RFQDeadlineApproaching);
    }

    public async sendRfqCopilotDeadlineApproachingMail(): Promise<ResponseViewModel<SuccessResponse>> {
        return await this.sendRfqDeadlineMail(TemplateType.RFQCopilotDeadlineApproaching);
    }

    private async sendRfqDeadlineMail(type: string): Promise<ResponseViewModel<SuccessResponse>> {
        const queues = await this.getMailQueuesByTemplateType(type);

        const rfqIds = [...new Set(queues.map((queue) => queue.rfq_id))];

        Promise.all(
            rfqIds.map(
                async (rfqId: string): Promise<void> => {
                    const message = queues.find((queue) => queue.rfq_id === rfqId).message;
                    const sendAt = queues.find((queue) => queue.rfq_id === rfqId).send_at;
                    const rfqNegotiation = await getRepository(Negotiation)
                        .createQueryBuilder('negotiation')
                        .where('negotiation.rfq_id = :rfqId', { rfqId })
                        .getOne();
                    // if negotiation table have entry for rfqId
                    if (rfqNegotiation) {
                        const validSupplierIds = rfqNegotiation.valid_supplier_ids || [];
                        const hasOffers = rfqNegotiation.session.offers.length !== 0;
                        if (hasOffers) {
                            const suppliersIds = validSupplierIds.filter((supplierId) =>
                                (rfqNegotiation.session.offers || []).find(
                                    (o) =>
                                        o.by == 'supplier' &&
                                        o.round == rfqNegotiation.round &&
                                        o.supplier_id !== supplierId,
                                ),
                            );
                            const suppliersIdsToWhomSendMail =
                                suppliersIds.length !== 0 ? suppliersIds : validSupplierIds;
                            const supplierUsers = await this.userService.getBySupplierIds(suppliersIdsToWhomSendMail);
                            const emails: string[] = supplierUsers.map((supplier) => supplier.email) || [];
                            await this.mailService.sendRfqMail(emails, message);
                            await this.setSentTime(rfqId, type, sendAt);
                        }
                    }
                    // if there is no entry in negotiation table for rfqId && no suppliers submit bid for round - 0
                    if (rfqNegotiation === undefined) {
                        const rfq = (await this.rfqService.getById(rfqId)).data;
                        const deadlines = rfq.negotiation_process.deadlines;
                        if (new Date(deadlines[0]) > new Date() && sendAt < new Date()) {
                            const suppliersEmailsToWhomSendMail =
                                rfq.suppliers.map((supplier) => supplier.supplier.email) || [];
                            await this.mailService.sendRfqMail(suppliersEmailsToWhomSendMail, message);
                            await this.setSentTime(rfqId, type, sendAt);
                        }
                    }
                },
            ),
        );

        return ResponseViewModel.withSuccess();
    }

    public async sendRfqCopilotOfferMail(): Promise<ResponseViewModel<SuccessResponse>> {
        const queues = await this.getMailQueuesByTemplateType(TemplateType.RFQCopilotOfferSubmitted);

        const rfqIds = [...new Set(queues.map((queue) => queue.rfq_id))];

        const rfqs = await this.circularDependenciesResolverService.getRfqsByIds(rfqIds);
        const validRfqIds = rfqs.map((rfq) => rfq.id);

        Promise.all(
            validRfqIds.map(
                async (rfqId: string): Promise<void> => {
                    const message = queues.find((queue) => queue.rfq_id === rfqId).message;
                    const sendAt = queues.find((queue) => queue.rfq_id === rfqId).send_at;
                    const userIds: string[] = queues
                        .find((queue) => queue.rfq_id === rfqId)
                        .user_ids.map((user) => user.user_id);

                    const suppliersToWhomSendMail = await this.userService.getByIds(userIds);
                    const emails = suppliersToWhomSendMail.map((user) => user.email);
                    await this.mailService.sendRfqMail(emails, message);
                    await this.setSentTime(rfqId, TemplateType.RFQCopilotOfferSubmitted, sendAt);
                },
            ),
        );

        return ResponseViewModel.withSuccess();
    }

    public async sendRfqRoundCompletedMail(): Promise<ResponseViewModel<SuccessResponse>> {
        const queues = await this.getMailQueuesByTemplateType(TemplateType.RFQRoundCompleted);

        const rfqIds = [...new Set(queues.map((queue) => queue.rfq_id))];

        const rfqs = await this.circularDependenciesResolverService.getRfqsByIds(rfqIds);
        const validRfqIds = rfqs.map((rfq) => rfq.id);

        Promise.all(
            validRfqIds.map(
                async (rfqId: string): Promise<void> => {
                    const message = queues.find((queue) => queue.rfq_id === rfqId).message;
                    const sendAt = queues.find((queue) => queue.rfq_id === rfqId).send_at;
                    const userIds: string[] = queues
                        .find((queue) => queue.rfq_id === rfqId)
                        .user_ids.map((user) => user.user_id);

                    const suppliersToWhomSendMail = await this.userService.getByIds(userIds);
                    const emails = suppliersToWhomSendMail.map((user) => user.email);
                    await this.mailService.sendRfqMail(emails, message);
                    await this.setSentTime(rfqId, TemplateType.RFQRoundCompleted, sendAt);
                },
            ),
        );

        return ResponseViewModel.withSuccess();
    }

    public async sendRfqExitMail(): Promise<ResponseViewModel<SuccessResponse>> {
        const queues = await this.getMailQueuesByTemplateType(TemplateType.RFQExited);

        const rfqIds = [...new Set(queues.map((queue) => queue.rfq_id))];

        const rfqs = await this.circularDependenciesResolverService.getRfqsByIds(rfqIds);
        const validRfqIds = rfqs.map((rfq) => rfq.id);

        Promise.all(
            validRfqIds.map(
                async (rfqId: string): Promise<void> => {
                    const message = queues.find((queue) => queue.rfq_id === rfqId).message;
                    const sendAt = queues.find((queue) => queue.rfq_id === rfqId).send_at;
                    const userIds: string[] = queues
                        .find((queue) => queue.rfq_id === rfqId)
                        .user_ids.map((user) => user.user_id);

                    const suppliersToWhomSendMail = await this.userService.getByIds(userIds);
                    const emails = suppliersToWhomSendMail.map((user) => user.email);
                    await this.mailService.sendRfqMail(emails, message);
                    await this.setSentTime(rfqId, TemplateType.RFQExited, sendAt);
                },
            ),
        );

        return ResponseViewModel.withSuccess();
    }

    public async sendRfqAwardWonMail(): Promise<ResponseViewModel<SuccessResponse>> {
        return await this.sendRfqAwardMail(TemplateType.RFQAwardedWon);
    }

    public async sendRfqAwardLostMail(): Promise<ResponseViewModel<SuccessResponse>> {
        return await this.sendRfqAwardMail(TemplateType.RFQAwardedLost);
    }

    public async sendRfqAwardPendingMail(): Promise<ResponseViewModel<SuccessResponse>> {
        return await this.sendRfqAwardMail(TemplateType.RFQAwardedPending);
    }

    public async sendSupplierOfferSubmitted(): Promise<ResponseViewModel<SuccessResponse>> {
        const queues = await getRepository(MailQueue)
            .createQueryBuilder('mail_queue')
            .where('mail_queue.last_sent_time IS NULL')
            .andWhere('mail_queue.type = :type', { type: TemplateType.RFQSupplierOfferSubmitted })
            .andWhere('mail_queue.send_at <= :date', { date: new Date() })
            .getMany();

        const rfqIds = [...new Set(queues.map((queue) => queue.rfq_id))];
        const rfqs = await this.circularDependenciesResolverService.getRfqsByIds(rfqIds);
        const activeAndCompletedRfqs = rfqs.filter(
            (rfq) => rfq.status === RfqStatus.active || rfq.status === RfqStatus.completed,
        );
        const validRfqIds = activeAndCompletedRfqs.map((rfq) => rfq.id);

        Promise.all(
            validRfqIds.map(
                async (rfqId: string): Promise<void> => {
                    const message = queues.find((queue) => queue.rfq_id === rfqId).message;
                    const sendAt = queues.find((queue) => queue.rfq_id === rfqId).send_at;
                    const metaInfo = queues.find((queue) => queue.rfq_id === rfqId).meta_info;
                    const rfqNegotiation = await getRepository(Negotiation)
                        .createQueryBuilder('negotiation')
                        .where('negotiation.rfq_id = :rfqId', { rfqId })
                        .getOne();
                    // if negotiation table have entry for rfqId
                    if (rfqNegotiation) {
                        const hasOffers = rfqNegotiation.session.offers.length !== 0;
                        if (hasOffers) {
                            const supplierOffer = (rfqNegotiation.session.offers || []).filter(
                                (o) =>
                                    o.by === 'supplier' &&
                                    o.round === Number(metaInfo.negotiation_round) &&
                                    o.supplier_id === metaInfo.supplier_id,
                            );
                            const supplierId = supplierOffer.map((o) => o.supplier_id);
                            const supplierUsers = await this.userService.getBySupplierIds(supplierId);
                            const emails: string[] = supplierUsers.map((supplier) => supplier.email) || [];
                            await this.mailService.sendRfqMail(emails, message);
                            await this.setSentTime(rfqId, TemplateType.RFQSupplierOfferSubmitted, sendAt);
                        }
                    }
                },
            ),
        );

        return ResponseViewModel.withSuccess();
    }

    public async sendSupplierOfferSubmittedToPM(): Promise<ResponseViewModel<SuccessResponse>> {
        return await this.sendProcurementManagerNotification(TemplateType.SupplierRoundOfferSubmittedProcurement);
    }

    public async sendAllSupplierOfferForRoundSubmittedToPM(): Promise<ResponseViewModel<SuccessResponse>> {
        return await this.sendProcurementManagerNotification(TemplateType.AllSuppliersRoundOfferSubmittedProcurement);
    }

    public async sendFinalRoundCompletedToPM(): Promise<ResponseViewModel<SuccessResponse>> {
        return await this.sendProcurementManagerNotification(TemplateType.FinalRoundOfferSubmittedProcurement);
    }

    public async sendAutoAcceptReachedToPM(): Promise<ResponseViewModel<SuccessResponse>> {
        return await this.sendProcurementManagerNotification(TemplateType.AutoAcceptanceScoreReached);
    }

    public async sendAwardRejectedToPM(): Promise<ResponseViewModel<SuccessResponse>> {
        return await this.sendProcurementManagerNotification(TemplateType.RFQAwardedReject);
    }

    public async sendAwardAcceptedToPM(): Promise<ResponseViewModel<SuccessResponse>> {
        return await this.sendProcurementManagerNotification(TemplateType.RFQAwardAccept);
    }

    private async sendProcurementManagerNotification(type: string): Promise<ResponseViewModel<SuccessResponse>> {
        const queues = await this.getMailQueuesByTemplateType(type);

        const rfqIds = [...new Set(queues.map((queue) => queue.rfq_id))];
        const rfqs = await this.circularDependenciesResolverService.getRfqsByIds(rfqIds);
        const rfqStatusForPMMail: string[] = [
            RfqStatus.active,
            RfqStatus.completed,
            RfqStatus.awarded,
            RfqStatus.awardrequested,
        ];
        const rfqStatusForPMRfqs = rfqs.filter((rfq) => rfqStatusForPMMail.includes(rfq.status));
        const validRfqIds = rfqStatusForPMRfqs.map((rfq) => rfq.id);

        Promise.all(
            validRfqIds.map(
                async (rfqId: string): Promise<void> => {
                    const message = queues.find((queue) => queue.rfq_id === rfqId).message;
                    const sendAt = queues.find((queue) => queue.rfq_id === rfqId).send_at;
                    const userIds = queues.find((queue) => queue.rfq_id === rfqId).user_ids;
                    const rfqNegotiation = await getRepository(Negotiation)
                        .createQueryBuilder('negotiation')
                        .where('negotiation.rfq_id = :rfqId', { rfqId })
                        .getOne();
                    // if negotiation table have entry for rfqId
                    if (rfqNegotiation) {
                        const hasOffers = rfqNegotiation.session.offers.length !== 0;
                        if (hasOffers) {
                            const userId = userIds[0].user_id;
                            const procurementUsers = await this.userService.getByIds([userId]);
                            const emails: string[] =
                                procurementUsers.map(
                                    (user) => user.authority === Roles.enterprise_admin && user.email,
                                ) || [];
                            await this.mailService.sendRfqMail(emails, message);
                            await this.setSentTime(rfqId, type, sendAt);
                        }
                    }
                },
            ),
        );

        return ResponseViewModel.withSuccess();
    }

    private async sendRfqAwardMail(type: string): Promise<ResponseViewModel<SuccessResponse>> {
        const queues = await this.getMailQueuesByTemplateType(type);

        const rfqIds = [...new Set(queues.map((queue) => queue.rfq_id))];
        const rfqs = await this.circularDependenciesResolverService.getRfqsByIds(rfqIds);
        const awardedRfqs = rfqs.filter(
            (rfq) => rfq.status === RfqStatus.awarded || rfq.status === RfqStatus.awardrequested,
        );
        const validRfqIds = awardedRfqs.map((rfq) => rfq.id);

        Promise.all(
            validRfqIds.map(
                async (rfqId: string): Promise<void> => {
                    const message = queues.find((queue) => queue.rfq_id === rfqId).message;
                    const sendAt = queues.find((queue) => queue.rfq_id === rfqId).send_at;
                    const rfqData = (await this.rfqService.getById(rfqId)).data;
                    const rfqSuppliers = rfqData.suppliers;

                    const suppliersToWhomSendMail =
                        type === TemplateType.RFQAwardedWon || type === TemplateType.RFQAwardedPending
                            ? rfqSuppliers.filter((supplier) => supplier.id === rfqData.winner_supplier_id)
                            : rfqSuppliers.filter((supplier) => supplier.id !== rfqData.winner_supplier_id);
                    suppliersToWhomSendMail.forEach(
                        async (supplier): Promise<void> => {
                            message.content = message.content.replace('{{supplier_name}}', supplier.supplier.name);
                            await this.mailService.sendRfqMail([supplier.supplier.email], message);
                        },
                    );
                    await this.setSentTime(rfqId, type, sendAt);
                },
            ),
        );

        return ResponseViewModel.withSuccess();
    }

    private async setSentTime(rfqId: string, type: string, sendAt?: Date): Promise<void> {
        const query = getRepository(MailQueue)
            .createQueryBuilder()
            .update(MailQueue)
            .set({ last_sent_time: new Date() })
            .where('mail_queue.rfq_id = :rfqId', { rfqId })
            .andWhere('mail_queue.type = :type', { type });

        if (sendAt) {
            query.andWhere('mail_queue.send_at = :sendAt', { sendAt });
        }

        await query.execute();
    }

    private getRfqIdsToSendMail(rfqs: Rfq[], organisations: Organisation[]): string[] {
        const validRfq: string[] = [];
        rfqs.forEach((rfq: Rfq): void => {
            const org = organisations.find((organisation) => organisation.organisation_id === rfq.organisation_id);
            const launchDate = rfq.negotiation_process.launch_date;
            const launchDateToUtcUnixTime = moment.tz(launchDate, org.timezone).utc().unix();
            const currentUnixTime = moment.utc().unix();
            const diff = launchDateToUtcUnixTime - currentUnixTime;
            if (diff <= 86400) {
                validRfq.push(rfq.id);
            }
        });

        return validRfq;
    }

    public async getDesktopNotification(): Promise<MailQueue[]> {
        const query = getRepository(MailQueue)
            .createQueryBuilder('mail_queue')
            .where('mail_queue.send_at <= :date', { date: new Date() });

        const [mailQueues] = await query.orderBy('mail_queue.created_date', 'DESC').getManyAndCount();
        return mailQueues;
    }

    public async getNotificationMessage(
        user: RequestUserResponse,
        pageRequest: PageRequest,
    ): Promise<ResponseViewModel<PaginatedResponseModel<MailQueueResponse>>> {
        const page = pageRequest.page && +pageRequest.page > 1 ? +pageRequest.page : 1;
        const read = pageRequest.read;
        const supplierNotificationTypes = Object.keys(Constant.SupplierNotificationMessage);
        const pmNotificationTypes = Object.keys(Constant.ProcurementManagerNotificationMessage);
        const query = getRepository(MailQueue)
            .createQueryBuilder('mail_queue')
            .where('mail_queue.send_at <= :date', { date: new Date() });

        if (user.role === Roles.supplier) {
            query.andWhere('mail_queue.type in (:...types)', { types: supplierNotificationTypes });
        } else {
            query.andWhere('mail_queue.type in (:...types)', { types: pmNotificationTypes });
        }
        query.andWhere(`mail_queue.user_ids @> :userIds`, {
            userIds: JSON.stringify([
                { user_id: user.user_id, ...(read && read !== undefined && { read: JSON.parse(read) }) },
            ]),
        });
        const unreadQuery = getRepository(MailQueue)
            .createQueryBuilder('mail_queue')
            .where('mail_queue.send_at <= :date', { date: new Date() });

        if (user.role === Roles.supplier) {
            unreadQuery.andWhere('mail_queue.type in (:...types)', { types: supplierNotificationTypes });
        } else {
            unreadQuery.andWhere('mail_queue.type in (:...types)', { types: pmNotificationTypes });
        }
        unreadQuery.andWhere(`mail_queue.user_ids @> :userIds`, {
            userIds: JSON.stringify([{ user_id: user.user_id, read: false }]),
        });

        const unreadCount = await unreadQuery.getCount();
        const [mailQueues, totalItems] = await query
            .skip((page - 1) * Constant.pageSize)
            .take(Constant.pageSize)
            .orderBy('mail_queue.created_date', 'DESC')
            .getManyAndCount();

        await Promise.all(
            mailQueues.map(async (mailQueue) => {
                const rfq = (await this.rfqService.getById(mailQueue.rfq_id)).data;
                const rfqOrganisation = (await this.organisationService.getById(rfq.organisation_id)).data;
                mailQueue.created_by.organisation_name = user.role === Roles.supplier && rfqOrganisation.name;
                mailQueue.message.snippet_content = await this.getNotificationTitle(
                    mailQueue,
                    rfq,
                    rfqOrganisation,
                    user.role,
                );

                mailQueue.message.procurement_url = `${env.PUBLIC_URL}/rfq-manager/view-rfq/?rfq_id=${rfq.id}&status=${rfq.status}`;
                mailQueue.message.supplier_url = `${env.PUBLIC_URL}/negotiation?rfq_id=${rfq.id}`;
            }),
        );

        const mailResponses = mailQueues.map((p) => MailQueueResponseTransformer.transform(p, user.user_id));
        const paginatedData = new PaginatedResponseModel<MailQueueResponse>(
            mailResponses,
            totalItems,
            page,
            unreadCount,
        );
        return ResponseViewModel.with<PaginatedResponseModel<MailQueueResponse>>(paginatedData);
    }

    public async setUnreadNotificationMessage(
        user: RequestUserResponse,
        mailQueueId?: string[],
        read?: boolean,
    ): Promise<ResponseViewModel<SuccessResponse>> {
        const userId = user.user_id;
        const query = getRepository(MailQueue)
            .createQueryBuilder('mail_queue')
            .where('mail_queue.send_at <= :date', { date: new Date() })
            .andWhere(`mail_queue.user_ids @> :userIds`, {
                userIds: JSON.stringify([{ user_id: userId }]),
            });

        // if single notification clicked to be read
        if (mailQueueId) {
            query.andWhere('mail_queue.id IN (:...mailQueueId) ', { mailQueueId: mailQueueId });
        }

        const mailQueues = await query.getMany();
        await Promise.all(
            mailQueues.map(async (mailQueue) => {
                const mailUserIndex = mailQueue.user_ids.findIndex((obj) => obj.user_id == user.user_id);
                mailQueue.user_ids[mailUserIndex].read = read;

                if (mailQueue) {
                    await getRepository(MailQueue)
                        .createQueryBuilder('mail_queue')
                        .update(MailQueue)
                        .set({ user_ids: mailQueue.user_ids })
                        .where({ id: mailQueue.id })
                        .execute();
                }
            }),
        );

        return ResponseViewModel.withSuccess(true);
    }

    private async getNotificationTitle(
        mailQueue: MailQueue,
        rfq: RfqResponse,
        rfqOrganisation: Organisation,
        userRole: string,
    ): Promise<string> {
        if (userRole === Roles.supplier) {
            let content: string = Constant.SupplierNotificationMessage[mailQueue.type as keyof Constant];
            content = content.replace('{{Organisation_Name}}', rfqOrganisation.name);

            if (mailQueue.type === TemplateType.RFQSupplierOfferSubmitted) {
                const rfqProcurementUser = await this.userService.getByIds([rfq.updated_by]);
                content = content.replace('{{Procurement_Manager_Name}}', rfqProcurementUser[0].name);
            } else {
                content = content.replace('{{Procurement_Manager_Name}}', mailQueue.created_by.name);
            }

            return content;
        }

        let content: string = Constant.ProcurementManagerNotificationMessage[mailQueue.type as keyof Constant];
        const supplierNotificationTypes: string[] = [
            TemplateType.SupplierRoundOfferSubmittedProcurement,
            TemplateType.RFQAwardAccept,
            TemplateType.RFQAwardedReject,
        ];
        if (supplierNotificationTypes.includes(mailQueue.type)) {
            const supplier = await this.userService.getByIds([mailQueue.created_by.id]);
            const supplierOrganisation =
                supplier && (await this.supplierService.getLightweightBySupplierIds([supplier[0].supplier_id]));
            content =
                supplier &&
                supplierOrganisation &&
                content
                    .replace('{{Supplier_Name}}', supplier[0].name)
                    .replace('{{Supplier_Organisation_Name}}', supplierOrganisation[0].name);
            if (content.includes('{{RFQ_Reference_No}}')) {
                content = content.replace('{{RFQ_Reference_No}}', rfq.rfq_number.toString());
            }
        } else {
            content = content.replace('{{RFQ_Reference_No}}', rfq.rfq_number.toString());
        }

        return content;
    }

    private async getMailQueuesByTemplateType(type: string): Promise<MailQueue[]> {
        const queues = await getRepository(MailQueue)
            .createQueryBuilder('mail_queue')
            .where('mail_queue.last_sent_time IS NULL')
            .andWhere('mail_queue.type = :type', { type })
            .andWhere('mail_queue.send_at <= :date', { date: new Date() })
            .getMany();
        return queues;
    }
}
