import {
    ApiKey,
    Bot,
    Category,
    Customer,
    Dashboard,
    MailQueue,
    Negotiation,
    NotificationServiceContract,
    Organisation,
    Product,
    ProductParameter,
    Rfq,
    RfqItem,
    RfqProcurementNegotiationServiceContract,
    RfqSupplier,
    Setting,
    Supplier,
    SupplierCategoryProduct,
    SupplierCompany,
    SupplierOrganisation,
    SupplierUser,
    Tenant,
    TenantUser,
    User,
} from '@negobot/shared';
import { ConnectionOptionsReader, createConnection } from 'typeorm';

import { Bootstrapper } from '@negobot/shared/';
import { Services } from './services';

export class LocalBootstrapper {
    public static async init(): Promise<void> {
        const container = Bootstrapper.getContainer();
        Services.bootstrap(container);
        const connectionOptionsReader = new ConnectionOptionsReader();
        const entities = [
            ApiKey,
            Bot,
            Customer,
            Category,
            Dashboard,
            Organisation,
            ProductParameter,
            Product,
            Setting,
            User,
            Tenant,
            TenantUser,
            MailQueue,
            Negotiation,
            Supplier,
            SupplierCompany,
            SupplierCategoryProduct,
            SupplierOrganisation,
            SupplierUser,
            Rfq,
            RfqItem,
            RfqSupplier,
        ];
        const connectionOptions = (await connectionOptionsReader.all())[0];
        connectionOptions.entities.push(...entities);
        await createConnection(connectionOptions);
        // do actual work
        const notificationService = container.get<NotificationServiceContract>('NotificationService');
        const rfqProcurementNegotiationService = container.get<RfqProcurementNegotiationServiceContract>(
            'RfqProcurementNegotiationService',
        );
        const jobServices = [
            rfqProcurementNegotiationService.checkRfqStatus(),
            rfqProcurementNegotiationService.checkRfqAwardPending(),
            notificationService.sendRfqInvitationMail(),
            notificationService.sendRfqDeadlineApproachingMail(),
            notificationService.sendRfqCopilotDeadlineApproachingMail(),
            notificationService.sendSupplierOfferSubmitted(),
            notificationService.sendRfqCopilotOfferMail(),
            notificationService.sendRfqRoundCompletedMail(),
            notificationService.sendRfqAwardWonMail(),
            notificationService.sendRfqAwardLostMail(),
            notificationService.sendRfqAwardPendingMail(),
            notificationService.sendSupplierOfferSubmittedToPM(),
            notificationService.sendFinalRoundCompletedToPM(),
            notificationService.sendAutoAcceptReachedToPM(),
            notificationService.sendAwardAcceptedToPM(),
            notificationService.sendAwardRejectedToPM(),
            notificationService.sendAllSupplierOfferForRoundSubmittedToPM(),
            notificationService.sendRfqExitMail(),
            rfqProcurementNegotiationService.updateDashboardDetails(),
        ];
        await Promise.all(jobServices);
    }
}
