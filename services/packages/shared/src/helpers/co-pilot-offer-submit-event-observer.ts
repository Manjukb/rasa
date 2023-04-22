import { RfqNotificationServiceContract, RfqServiceContract, UserServiceContract } from '../services';

import { Bootstrapper } from '../bootstrap/bootstrapper';
import { Constant } from './constant';
import { Negotiation } from '../database/models';
import { TemplateType } from '../enum/template-type';
import { eventSink } from '../factories';
import { getRepository } from 'typeorm';

class CoPilotOfferSubmitEventObserver {
    public onCopilotOfferSubmitted() {
        eventSink.addObserver(Constant.CopilotOfferEvents.onCopilotOfferSubmitted, async (data) => {
            data = data[0];
            const [offer, user, rfqId] = data;
            const container = Bootstrapper.getContainer();
            const rfqNotificationService = container.get<RfqNotificationServiceContract>('RfqNotificationService');
            const rfqService = container.get<RfqServiceContract>('RfqService');
            const userService = container.get<UserServiceContract>('UserService');
            const rfq = (await rfqService.getById(rfqId)).data;
            const rfqNegotiationProcess = rfq && rfq.negotiation_process;
            const offerCurrency = offer && offer.rfq_offer && offer.rfq_offer.rfq_items[0]?.currency;
            const currencyFormatter = new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: offerCurrency || 'USD',
            });
            const coPilotOfferTotal = offer && currencyFormatter.format(offer.total);
            const coPilotDeadline =
                rfqNegotiationProcess && new Date(rfqNegotiationProcess.deadlines[Number(offer.round)]);
            const rfqNegotiation = await getRepository(Negotiation).findOne({ rfq_id: rfqId });
            const validSupplierIds = rfqNegotiation && rfqNegotiation.valid_supplier_ids;
            const rfqSupplierUsers = await userService.getBySupplierIds(validSupplierIds);
            const rfqSupplierUserIds = rfqSupplierUsers && rfqSupplierUsers.map((supplier) => supplier.user_id);
            const userIds = rfqSupplierUserIds.map((u) => {
                return { user_id: u, read: false };
            });
            const mailCreatedByInfo = {
                id: user.user_id,
                name: user.name,
            };

            const emailTemplateForSupplierForOffer = (
                await rfqNotificationService.setEmailTemplateForCopilotOfferSubmittedAndDeadline(
                    rfq,
                    TemplateType.RFQCopilotOfferSubmitted,
                    rfq.organisation_id,
                    coPilotOfferTotal,
                    coPilotDeadline,
                )
            ).data;

            const emailTemplateForSupplierForDeadline = (
                await rfqNotificationService.setEmailTemplateForCopilotOfferSubmittedAndDeadline(
                    rfq,
                    TemplateType.RFQCopilotDeadlineApproaching,
                    rfq.organisation_id,
                    coPilotOfferTotal,
                    coPilotDeadline,
                )
            ).data;
            const messageForSupplierForOffer = {
                subject: emailTemplateForSupplierForOffer.subject,
                content: emailTemplateForSupplierForOffer.message,
            };
            const messageForSupplierForDeadline = {
                subject: emailTemplateForSupplierForDeadline.subject,
                content: emailTemplateForSupplierForDeadline.message,
            };
            // Mail-Queue for 'RfqCopilotOfferSubmitted'

            await rfqNotificationService.save(
                rfq.id,
                messageForSupplierForOffer,
                TemplateType.RFQCopilotOfferSubmitted,
                new Date(),
                mailCreatedByInfo,
                userIds,
            );
            // Mail-Queue for 'RFQCopilotDeadlineApproaching'
            await rfqNotificationService.save(
                rfq.id,
                messageForSupplierForDeadline,
                TemplateType.RFQCopilotDeadlineApproaching,
                new Date(+coPilotDeadline - 1000 * 60 * 60 * 24),
                mailCreatedByInfo,
                userIds,
            );
        });
    }
}
const eventSinkObserver = new CoPilotOfferSubmitEventObserver();
const CopilotOfferSubmitted = eventSinkObserver.onCopilotOfferSubmitted();

export { CopilotOfferSubmitted };
