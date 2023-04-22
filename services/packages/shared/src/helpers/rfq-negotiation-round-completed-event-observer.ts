import { RfqNotificationServiceContract, UserServiceContract } from '../services';

import { Bootstrapper } from '../bootstrap/bootstrapper';
import { Constant } from './constant';
import { TemplateType } from '../enum/template-type';
import { eventSink } from '../factories';

class RfqNegotiationRoundCompletedEventObserver {
    public onRfqNegotiationRoundCompleted() {
        eventSink.addObserver(Constant.SupplierOfferEvents.onRfqNegotiationRoundCompleted, async (data) => {
            data = data[0];
            const [negotiation, rfq, botOffer] = data;
            const container = Bootstrapper.getContainer();
            const rfqNotificationService = container.get<RfqNotificationServiceContract>('RfqNotificationService');
            const userService = container.get<UserServiceContract>('UserService');
            const roundDeadline: Date = new Date(rfq.negotiation_process.deadlines[negotiation.round]);
            const offerCurrency = rfq && rfq.items && rfq.items[0]?.currency;
            const currencyFormatter = new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: offerCurrency || 'USD',
            });
            const botOfferTotal = botOffer && currencyFormatter.format(botOffer.total);
            const emailTemplate = (
                await rfqNotificationService.setEmailTemplateForRoundComplete(
                    rfq,
                    TemplateType.RFQRoundCompleted,
                    rfq.organisation_id,
                    roundDeadline,
                    botOfferTotal,
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
            const validSupplierUserIds = await userService.getBySupplierIds(negotiation.valid_supplier_ids);
            const userIds = validSupplierUserIds.map((u) => {
                return { user_id: u.user_id, read: false };
            });
            await rfqNotificationService.save(
                rfq.id,
                message,
                TemplateType.RFQRoundCompleted,
                new Date(),
                mailCreatedByInfo,
                userIds,
            );
        });
    }
}
const eventSinkObserver = new RfqNegotiationRoundCompletedEventObserver();
const NegotiationRoundCompleted = eventSinkObserver.onRfqNegotiationRoundCompleted();

export { NegotiationRoundCompleted };
