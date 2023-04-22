import { RfqNotificationServiceContract, RfqServiceContract, UserServiceContract } from '../services';

import { Bootstrapper } from '../bootstrap/bootstrapper';
import { Constant } from './constant';
import { TemplateType } from '../enum/template-type';
import { eventSink } from '../factories';

class RfqExitEventObserver {
    public onRfqExit() {
        eventSink.addObserver(Constant.PMEvents.onRfqExit, async (data) => {
            data = data[0];
            const [rfqId, user] = data;
            const container = Bootstrapper.getContainer();
            const rfqNotificationService = container.get<RfqNotificationServiceContract>('RfqNotificationService');
            const rfqService = container.get<RfqServiceContract>('RfqService');
            const userService = container.get<UserServiceContract>('UserService');
            const rfq = (await rfqService.getById(rfqId)).data;
            const allRfqSupplierIds = rfq && rfq.suppliers.map((s) => s.id);
            const rfqSupplierUsers = await userService.getBySupplierIds(allRfqSupplierIds);
            const rfqSupplierUserIds = rfqSupplierUsers && rfqSupplierUsers.map((supplier) => supplier.user_id);
            const userIds = rfqSupplierUserIds.map((u) => {
                return { user_id: u, read: false };
            });
            const mailCreatedByInfo = {
                id: user.user_id,
                name: user.name,
            };
            const emailTemplateForSupplier = (
                await rfqNotificationService.setEmailTemplateForRfqExit(
                    rfq,
                    TemplateType.RFQExited,
                    rfq.organisation_id,
                )
            ).data;
            const messageForSupplierForOffer = {
                subject: emailTemplateForSupplier.subject,
                content: emailTemplateForSupplier.message,
            };
            // Mail-Queue for 'RfqExit'
            await rfqNotificationService.save(
                rfq.id,
                messageForSupplierForOffer,
                TemplateType.RFQExited,
                new Date(),
                mailCreatedByInfo,
                userIds,
            );
        });
    }
}
const eventSinkObserver = new RfqExitEventObserver();
const RfqExit = eventSinkObserver.onRfqExit();

export { RfqExit };
