import {
    ApiKeyService,
    ApiKeyServiceContract,
    AuthenticationService,
    AuthenticationServiceContract,
    CustomerService,
    CustomerServiceContract,
    MailService,
    MailServiceContract,
    OrganisationService,
    OrganisationServiceContract,
    PermissionService,
    PermissionServiceContract,
    SettingService,
    SettingServiceContract,
    SupplierWebhookService,
    SupplierWebhookServiceContract,
    TenantService,
    TenantServiceContract,
    TenantUserService,
    TenantUserServiceContract,
    UserOrganisationService,
    UserOrganisationServiceContract,
    UserService,
    UserServiceContract,
    WebhookService,
    WebhookServiceContract,
} from '@negobot/shared/';

import { Container } from 'inversify';

export class Services {
    public static bootstrap(container: Container): void {
        container.bind<AuthenticationServiceContract>('AuthenticationService').to(AuthenticationService);
        container.bind<CustomerServiceContract>('CustomerService').to(CustomerService);
        container.bind<PermissionServiceContract>('PermissionService').to(PermissionService);
        container.bind<MailServiceContract>('MailService').to(MailService);
        container.bind<ApiKeyServiceContract>('ApiKeyService').to(ApiKeyService);
        container.bind<UserOrganisationServiceContract>('UserOrganisationService').to(UserOrganisationService);
        container.bind<UserServiceContract>('UserService').to(UserService);
        container.bind<TenantServiceContract>('TenantService').to(TenantService);
        container.bind<TenantUserServiceContract>('TenantUserService').to(TenantUserService);
        container.bind<WebhookServiceContract>('WebhookService').to(WebhookService);
        container.bind<OrganisationServiceContract>('OrganisationService').to(OrganisationService);
        container.bind<SupplierWebhookServiceContract>('SupplierWebhookService').to(SupplierWebhookService);
        container.bind<SettingServiceContract>('SettingService').to(SettingService);
    }
}
