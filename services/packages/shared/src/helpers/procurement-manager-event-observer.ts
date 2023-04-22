import { RfqNotificationServiceContract, RfqServiceContract, UserServiceContract } from '../services';

import { Bootstrapper } from '../bootstrap/bootstrapper';
import { Constant } from './constant';
import { TemplateType } from '../enum/template-type';
import { eventSink } from '../factories';

class ProcurementManagerEventObserver {
    public onRfqFinalRoundCompleted() {
        eventSink.addObserver(Constant.SupplierOfferEvents.onRfqFinalRoundCompleted, async (data) => {
            data = data[0];
            const [rfqId, round] = data;
            const container = Bootstrapper.getContainer();
            const rfqNotificationService = container.get<RfqNotificationServiceContract>('RfqNotificationService');
            const rfqService = container.get<RfqServiceContract>('RfqService');
            const userService = container.get<UserServiceContract>('UserService');
            const rfq = (await rfqService.getById(rfqId)).data;
            const emailTemplateForPM = (
                await rfqNotificationService.setEmailTemplateForPMonFinalRoundComplete(
                    rfq,
                    TemplateType.FinalRoundOfferSubmittedProcurement,
                    rfq.organisation_id,
                    round as number,
                )
            ).data;
            const messageForPM = {
                subject: emailTemplateForPM.subject,
                content: emailTemplateForPM.message,
            };
            const offerSubmittedUser = await userService.getByIds([rfq.updated_by]);
            const mailCreatedByInfo = {
                id: rfq.updated_by,
                name: offerSubmittedUser[0].name,
            };
            const userIdsForPM = [{ user_id: rfq.updated_by, read: false }];
            await rfqNotificationService.save(
                rfq.id,
                messageForPM,
                TemplateType.FinalRoundOfferSubmittedProcurement,
                new Date(),
                mailCreatedByInfo,
                userIdsForPM,
            );
        });
    }

    public onAutoAcceptScoreReached() {
        eventSink.addObserver(Constant.SupplierOfferEvents.onAutoAcceptScoreReached, async (data) => {
            data = data[0];
            const rfqId = data;
            const container = Bootstrapper.getContainer();
            const rfqNotificationService = container.get<RfqNotificationServiceContract>('RfqNotificationService');
            const rfqService = container.get<RfqServiceContract>('RfqService');
            const userService = container.get<UserServiceContract>('UserService');
            const rfq = (await rfqService.getById(rfqId)).data;
            const emailTemplateForPM = (
                await rfqNotificationService.setEmailTemplateForPMonAutoAcceptScoreReached(
                    rfq,
                    TemplateType.AutoAcceptanceScoreReached,
                    rfq.organisation_id,
                )
            ).data;
            const messageForPM = {
                subject: emailTemplateForPM.subject,
                content: emailTemplateForPM.message,
            };
            const offerSubmittedUser = await userService.getByIds([rfq.updated_by]);
            const mailCreatedByInfo = {
                id: rfq.updated_by,
                name: offerSubmittedUser[0].name,
            };
            const userIdsForPM = [{ user_id: rfq.updated_by, read: false }];
            await rfqNotificationService.save(
                rfq.id,
                messageForPM,
                TemplateType.AutoAcceptanceScoreReached,
                new Date(),
                mailCreatedByInfo,
                userIdsForPM,
            );
        });
    }
}
const eventSinkObserver = new ProcurementManagerEventObserver();
const FinalRoundCompleted = eventSinkObserver.onRfqFinalRoundCompleted();
const AutoAcceptReached = eventSinkObserver.onAutoAcceptScoreReached();

export { FinalRoundCompleted, AutoAcceptReached };
