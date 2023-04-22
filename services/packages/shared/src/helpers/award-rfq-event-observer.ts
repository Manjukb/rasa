import { RfqNotificationServiceContract, RfqServiceContract, UserServiceContract } from '../services';

import { Bootstrapper } from '../bootstrap/bootstrapper';
import { Constant } from './constant';
import { TemplateType } from '../enum/template-type';
import { eventSink } from '../factories';

class AwardRfqEventObserver {
    public onRfqAwarded() {
        eventSink.addObserver(Constant.RfqStatus.awardrequested, async (data) => {
            data = data[0];
            const [rfqId, user] = data;
            const container = Bootstrapper.getContainer();
            const rfqNotificationService = container.get<RfqNotificationServiceContract>('RfqNotificationService');
            const rfqService = container.get<RfqServiceContract>('RfqService');
            const userService = container.get<UserServiceContract>('UserService');
            const rfq = (await rfqService.getById(rfqId)).data;
            const rfqStatusAfterAward: string[] = [TemplateType.RFQAwardedPending];
            const mailCreatedByInfo = {
                id: user.user_id,
                name: user.name,
            };
            await Promise.all(
                rfqStatusAfterAward.map(async (rfqStatus) => {
                    const emailTemplate = (
                        await rfqNotificationService.setEmailTemplateForAward(rfq, rfqStatus, rfq.organisation_id)
                    ).data;
                    const subject: string = emailTemplate.subject;
                    const content: string = emailTemplate.message;
                    const message = {
                        subject,
                        content,
                    };
                    const rfqSupplierIds = rfq.suppliers.map((e) => e.id);
                    const rfqSupplierInfo = await userService.getBySupplierIds(rfqSupplierIds);
                    const allUserIds =
                        rfqStatus === TemplateType.RFQAwardedPending
                            ? rfqSupplierInfo
                                  .filter((supplier: any) => supplier.supplier_id === rfq.winner_supplier_id)
                                  .map((e) => e.user_id)
                            : rfqSupplierInfo
                                  .filter((supplier: any) => supplier.supplier_id !== rfq.winner_supplier_id)
                                  .map((e) => e.user_id);

                    const userIds = (allUserIds || []).map((u) => {
                        return { user_id: u, read: false };
                    });
                    await rfqNotificationService.save(
                        rfq.id,
                        message,
                        rfqStatus,
                        new Date(),
                        mailCreatedByInfo,
                        userIds,
                    );
                }),
            );
        });
    }
}
const eventSinkObserver = new AwardRfqEventObserver();
const NewRfqAwarded = eventSinkObserver.onRfqAwarded();

export { NewRfqAwarded };
