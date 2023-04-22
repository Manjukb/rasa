export enum Roles {
    super_admin = 'super_admin',
    org_admin = 'org_admin',
    enterprise_admin = 'enterprise_admin',
    enterprise_user = 'enterprise_user',
    saas_admin = 'saas_admin',
    tenant_admin = 'tenant_admin',
    tenant_user = 'tenant_user',
    customer = 'customer',
    supplier = 'supplier',
}

export const RolesCreatedByFrontEnd: string[] = [Roles.enterprise_admin, Roles.enterprise_user, Roles.saas_admin];
