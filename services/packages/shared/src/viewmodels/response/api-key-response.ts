import { OrganisationLightWeightResponse } from './organisation-light-weight-response';

export class ApiKeyResponse {
    public id: string;
    public user_id: string;
    public organisation_id: string;
    public business_type: string;
    public api_key: string;
    public issued_date: Date;
    public expired_date: Date;
    public domains: string[];

    public organisation: OrganisationLightWeightResponse;
}

export class LightWeightApiKeyResponse {
    public api_key: string;
    public business_type: string;
    public issued_date: Date;
    public expired_date: Date;
}
