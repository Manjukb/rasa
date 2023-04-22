import {
    OrganisationServiceContract,
    RfqNotificationServiceContract,
    RfqServiceContract,
    UserServiceContract,
} from '../services';

import { Bootstrapper } from '../bootstrap/bootstrapper';
import { Constant } from './constant';
import { MailQueue } from '../database/models';
import { Offer } from '../types';
import { TemplateType } from '../enum/template-type';
import { env } from '..';
import { eventSink } from '../factories';
import { getRepository } from 'typeorm';

class RfqAllSupplierSubmitRoundEventObserver {
    public onAllSuppliersRoundOfferSubmitted() {
        eventSink.addObserver(Constant.SupplierOfferEvents.onAllSuppliersRoundOfferSubmitted, async (data) => {
            data = data[0];
            const [neg, messageType, rfqId] = data;
            const container = Bootstrapper.getContainer();
            const rfqNotificationService = container.get<RfqNotificationServiceContract>('RfqNotificationService');
            const userService = container.get<UserServiceContract>('UserService');
            const organisationService = container.get<OrganisationServiceContract>('OrganisationService');
            const rfqService = container.get<RfqServiceContract>('RfqService');
            const rfq = (await rfqService.getById(rfqId)).data;
            const mailQueues = await getRepository(MailQueue).find({
                rfq_id: rfq.id,
                type: TemplateType.AllSuppliersRoundOfferSubmittedProcurement,
            });
            if (mailQueues.length > neg.round - 1) {
                return;
            }
            const organisation = (await organisationService.getById(rfq.organisation_id)).data;

            const timeLag: number =
                organisation &&
                organisation.organisation_settings &&
                organisation.organisation_settings.bot_counter_offer_delay
                    ? organisation.organisation_settings.bot_counter_offer_delay
                    : env.BOT_COUNTER_OFFER_DELAY / 60;
            const offer: Offer = neg.session.offers.find((o: any) => o.by === 'supplier' && o.round === neg.round);
            offer.at = new Date(offer?.at);
            const deadlineDate = new Date(rfq.negotiation_process.deadlines[neg.round]);
            const coPilotDeadline: Date =
                messageType === 'deadlinePassed'
                    ? new Date(deadlineDate.setMinutes(deadlineDate.getMinutes() + timeLag))
                    : new Date(offer?.at.setMinutes(offer?.at.getMinutes() + timeLag));
            const emailTemplate = (
                await rfqNotificationService.setEmailTemplateForPMonAllSupplierSubmitForRound(
                    rfq,
                    TemplateType.AllSuppliersRoundOfferSubmittedProcurement,
                    rfq.organisation_id,
                    coPilotDeadline,
                    neg.round,
                )
            ).data;
            const subject: string = emailTemplate.subject;
            const content: string = emailTemplate.message;
            const message = {
                subject,
                content,
            };
            const rfqProcurementUser = await userService.getByIds([rfq.updated_by]);
            const mailCreatedByInfo = {
                id: rfqProcurementUser[0].user_id,
                name: rfqProcurementUser[0].name,
            };
            const userIdsForPM = [{ user_id: rfq.updated_by, read: false }];
            await rfqNotificationService.save(
                rfq.id,
                message,
                TemplateType.AllSuppliersRoundOfferSubmittedProcurement,
                new Date(),
                mailCreatedByInfo,
                userIdsForPM,
            );
        });
    }
}
const eventSinkObserver = new RfqAllSupplierSubmitRoundEventObserver();
const NewAllSupplierSubmitRound = eventSinkObserver.onAllSuppliersRoundOfferSubmitted();

export { NewAllSupplierSubmitRound };
