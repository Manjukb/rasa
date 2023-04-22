import { Organisation } from '../../database/models';
import { LightWeightApiKeyResponse } from './api-key-response';

export class OrganisationResponse {
    public id: string;
    public organisation_id: string;
    public name: string;
    public type?: string;
    public status: boolean;
    public client_type: string;
    public timezone: string;

    public business_types: string[];
    public domains: string[];
    public created_date: Date;
    public updated_date: Date;

    public apiKey?: LightWeightApiKeyResponse;
    public apiKeys?: LightWeightApiKeyResponse[];

    public static fromModel(org: Organisation): OrganisationResponse {
        if (!org) {
            return null;
        }
        Object.assign(new OrganisationResponse(), org);
    }
}

export class SupplierOrganisationResponse {
    public id: string;
    public name: string;
    public is_active: boolean;
    public address: string;
    public created_date: Date;

    public static fromModel(org: Organisation): SupplierOrganisationResponse {
        const { organisation_id: id, name, is_active, address, created_date } = org;

        return {
            id,
            name,
            is_active,
            address,
            created_date,
        };
    }

    public static fromModels(orgs: Organisation[]): SupplierOrganisationResponse[] {
        return orgs.map((o) => SupplierOrganisationResponse.fromModel(o));
    }
}
