import { RfqNotificationServiceContract, RfqServiceContract } from '../services';

import { Bootstrapper } from '../bootstrap/bootstrapper';
import { Constant } from './constant';
import { TemplateType } from '../enum/template-type';
import { eventSink } from '../factories';

class RejectRfqEventObserver {
    public onRfqAwarded() {
        eventSink.addObserver(Constant.RfqStatus.awardRejected, async (data) => {
            data = data[0];
            const [rfqId, user] = data;
            const container = Bootstrapper.getContainer();
            const rfqNotificationService = container.get<RfqNotificationServiceContract>('RfqNotificationService');
            const rfqService = container.get<RfqServiceContract>('RfqService');
            const rfq = (await rfqService.getById(rfqId)).data;
            const mailCreatedByInfo = {
                id: user.user_id,
                name: user.name,
            };
            const emailTemplate = (
                await rfqNotificationService.setEmailTemplateForPMoNSupplierAwardRejectOrAccept(
                    rfq,
                    TemplateType.RFQAwardedReject,
                    rfq.organisation_id,
                    user.supplier_id,
                )
            ).data;
            const subject: string = emailTemplate.subject;
            const content: string = emailTemplate.message;
            const message = {
                subject,
                content,
            };

            const userIds = [{ user_id: rfq.updated_by, read: false }];

            await rfqNotificationService.save(
                rfq.id,
                message,
                TemplateType.RFQAwardedReject,
                new Date(),
                mailCreatedByInfo,
                userIds,
            );
        });
    }
}
const eventSinkObserver = new RejectRfqEventObserver();
const NewRfqAwardedRejected = eventSinkObserver.onRfqAwarded();

export { NewRfqAwardedRejected };
