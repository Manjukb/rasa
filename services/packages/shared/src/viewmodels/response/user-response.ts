import { OrganisationLightWeightResponse } from './organisation-light-weight-response';

export class UserResponse {
    public id: string;
    public user_id: string;
    public email: string;
    public name: string;
    public role: string;
    public status: boolean;
    public business_types: string[];
    public organisation_id: string;
    public tenant_id: string | null;

    public organisation: OrganisationLightWeightResponse;
    public supplier_id?: string;
}
