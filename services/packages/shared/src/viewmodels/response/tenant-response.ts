import { OrganisationResponse } from './organisation-response';
import { Tenant } from '../../database/models';

export class TenantResponse {
    public id: string;
    public name: string;
    public external_identifier?: string;
    public business_type: string;
    public organisation: OrganisationResponse;

    public static fromModel(tenant: Tenant): TenantResponse {
        if (!tenant) {
            return null;
        }
        const tenantResponse = new TenantResponse();
        tenantResponse.id = tenant.id;
        tenantResponse.name = tenant.name;
        tenantResponse.business_type = tenant.business_type;
        tenantResponse.external_identifier = tenant.name;
        tenantResponse.organisation = OrganisationResponse.fromModel(tenant.organisation);
        if (!tenantResponse.organisation) {
            tenantResponse.organisation = new OrganisationResponse();
            tenantResponse.organisation.id = tenant.organisation_id;
        }
        return tenantResponse;
    }
}
