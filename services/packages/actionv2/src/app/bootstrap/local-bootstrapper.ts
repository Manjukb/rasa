import {
    ApiKey,
    Bot,
    Category,
    Customer,
    Dashboard,
    EmailTemplate,
    MailQueue,
    Negotiation,
    Organisation,
    Product,
    ProductParameter,
    Rfq,
    RfqItem,
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
import { Controllers } from './controllers';
import { Services } from './services';

export class LocalBootstrapper {
    public static init(): void {
        Bootstrapper.bootstrap(
            async (container): Promise<void> => {
                Controllers.bootstrap(container);
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
                    Negotiation,
                    Supplier,
                    SupplierCompany,
                    SupplierCategoryProduct,
                    SupplierOrganisation,
                    SupplierUser,
                    Rfq,
                    RfqItem,
                    RfqSupplier,
                    EmailTemplate,
                    MailQueue,
                ];
                const connectionOptions = (await connectionOptionsReader.all())[0];
                connectionOptions.entities.push(...entities);
                await createConnection(connectionOptions);
            },
        );
    }
}
