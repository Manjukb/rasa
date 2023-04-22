import { RfqNotificationServiceContract, RfqServiceContract, UserServiceContract } from '../services';

import { Bootstrapper } from '../bootstrap/bootstrapper';
import { Constant } from './constant';
import { TemplateType } from '../enum/template-type';
import { eventSink } from '../factories';

class RfqSupplierOfferSubmitEventObserver {
    public onSupplierOfferSubmitted() {
        eventSink.addObserver(Constant.SupplierOfferEvents.onSupplierOfferSubmitted, async (data) => {
            data = data[0];
            const [offer, rfqId] = data;
            const container = Bootstrapper.getContainer();
            const rfqNotificationService = container.get<RfqNotificationServiceContract>('RfqNotificationService');
            const rfqService = container.get<RfqServiceContract>('RfqService');
            const userService = container.get<UserServiceContract>('UserService');
            const rfq = (await rfqService.getById(rfqId)).data;
            const emailTemplateForSupplier = (
                await rfqNotificationService.setEmailTemplateForSubmittedSupplierOffer(
                    rfq,
                    TemplateType.RFQSupplierOfferSubmitted,
                    rfq.organisation_id,
                    offer.supplier_id,
                )
            ).data;
            const emailTemplateForPM = (
                await rfqNotificationService.setEmailTemplateForPMoNSupplierOffer(
                    rfq,
                    TemplateType.SupplierRoundOfferSubmittedProcurement,
                    rfq.organisation_id,
                    offer.supplier_id,
                    offer.round as number,
                )
            ).data;
            const messageForSupplier = {
                subject: emailTemplateForSupplier.subject,
                content: emailTemplateForSupplier.message,
            };
            const messageForPM = {
                subject: emailTemplateForPM.subject,
                content: emailTemplateForPM.message,
            };
            const supplier_id: string = offer.supplier_id;
            const negotiation_round: string = offer.round;
            const metaInfo = {
                supplier_id,
                negotiation_round,
            };
            const offerSubmittedUser = await userService.getBySupplierIds([offer.supplier_id]);
            const mailCreatedByInfo = {
                id: offerSubmittedUser[0].user_id,
                name: offerSubmittedUser[0].name,
            };
            const userIdsForSupplier = [{ user_id: offerSubmittedUser[0].user_id, read: false }];
            const userIdsForPM = [{ user_id: rfq.updated_by, read: false }];
            await rfqNotificationService.save(
                rfq.id,
                messageForSupplier,
                TemplateType.RFQSupplierOfferSubmitted,
                new Date(),
                mailCreatedByInfo,
                userIdsForSupplier,
                metaInfo,
            );
            await rfqNotificationService.save(
                rfq.id,
                messageForPM,
                TemplateType.SupplierRoundOfferSubmittedProcurement,
                new Date(),
                mailCreatedByInfo,
                userIdsForPM,
                metaInfo,
            );
        });
    }
}
const eventSinkObserver = new RfqSupplierOfferSubmitEventObserver();
const NewSupplierOfferSubmitted = eventSinkObserver.onSupplierOfferSubmitted();

export { NewSupplierOfferSubmitted };
