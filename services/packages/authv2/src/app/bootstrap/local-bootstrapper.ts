import {
    ApiKey,
    Category,
    Company,
    Customer,
    Dashboard,
    Organisation,
    OrganisationCompany,
    OrganisationCompanySupplier,
    Product,
    Rfq,
    RfqItem,
    RfqSupplier,
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
                    Customer,
                    Dashboard,
                    Organisation,
                    User,
                    Tenant,
                    TenantUser,
                    Company,
                    OrganisationCompany,
                    OrganisationCompanySupplier,
                    Supplier,
                    SupplierCompany,
                    SupplierCategoryProduct,
                    SupplierUser,
                    SupplierOrganisation,
                    Rfq,
                    RfqItem,
                    RfqSupplier,
                    Product,
                    Category,
                ];
                const connectionOptions = (await connectionOptionsReader.all())[0];
                connectionOptions.entities.push(...entities);
                await createConnection(connectionOptions);
            },
        );
    }
}
