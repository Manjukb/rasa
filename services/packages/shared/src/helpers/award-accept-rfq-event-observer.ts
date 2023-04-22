import { RfqNotificationServiceContract, RfqServiceContract, UserServiceContract } from '../services';

import { Bootstrapper } from '../bootstrap/bootstrapper';
import { Constant } from './constant';
import { TemplateType } from '../enum/template-type';
import { eventSink } from '../factories';

class AwardAcceptRfqEventObserver {
    public onRfqAwarded() {
        eventSink.addObserver(Constant.RfqStatus.awarded, async (data) => {
            data = data[0];
            const [rfqId, user] = data;
            const container = Bootstrapper.getContainer();
            const rfqNotificationService = container.get<RfqNotificationServiceContract>('RfqNotificationService');
            const rfqService = container.get<RfqServiceContract>('RfqService');
            const userService = container.get<UserServiceContract>('UserService');
            const rfq = (await rfqService.getById(rfqId)).data;
            const rfqStatusAfterAward: string[] = [TemplateType.RFQAwardedLost, TemplateType.RFQAwardedWon];

            // notification for suppliers on RFQAwardedWon/RFQAwardedLost
            await Promise.all(
                rfqStatusAfterAward.map(async (rfqStatus) => {
                    const emailTemplate = (
                        await rfqNotificationService.setEmailTemplateForAward(rfq, rfqStatus, rfq.organisation_id)
                    ).data;
                    const userPM = await userService.getByIds([rfq.updated_by]);
                    const mailCreatedByInfo = {
                        id: rfq.updated_by,
                        name: userPM[0].name,
                    };
                    const subject: string = emailTemplate.subject;
                    const content: string = emailTemplate.message;
                    const message = {
                        subject,
                        content,
                    };
                    const rfqSupplierIds = rfq.suppliers.map((e) => e.id);
                    const rfqSupplierInfo = await userService.getBySupplierIds(rfqSupplierIds);
                    const allUserIds =
                        rfqStatus === TemplateType.RFQAwardedWon
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

            // notification for PM that supplier accept the award-offer
            const mailCreatedByInfoForPM = {
                id: user.user_id,
                name: user.name,
            };
            const emailTemplateForPM = (
                await rfqNotificationService.setEmailTemplateForPMoNSupplierAwardRejectOrAccept(
                    rfq,
                    TemplateType.RFQAwardAccept,
                    rfq.organisation_id,
                    user.supplier_id,
                )
            ).data;
            const messageForPM = {
                subject: emailTemplateForPM.subject,
                content: emailTemplateForPM.message,
            };

            const userIdsForPM = [{ user_id: rfq.updated_by, read: false }];

            await rfqNotificationService.save(
                rfq.id,
                messageForPM,
                TemplateType.RFQAwardAccept,
                new Date(),
                mailCreatedByInfoForPM,
                userIdsForPM,
            );
        });
    }
}
const eventSinkObserver = new AwardAcceptRfqEventObserver();
const NewRfqAwardedAccept = eventSinkObserver.onRfqAwarded();

export { NewRfqAwardedAccept };
