import { ApiKeyResponseTransformer } from './api-key-response-transformer';
import { Organisation } from '../database/models';
import { OrganisationResponse } from '../viewmodels/response';

export class OrganisationResponseTransformer {
    public static transform(organisation: Organisation): OrganisationResponse {
        const organisationResponse = new OrganisationResponse();
        organisationResponse.id = organisation.id;
        organisationResponse.organisation_id = organisation.organisation_id;
        organisationResponse.name = organisation.organisation_info.name;
        organisationResponse.type = organisation.organisation_info.type;
        organisationResponse.status = organisation.is_active;
        organisationResponse.client_type = organisation.client_type;
        organisationResponse.timezone = organisation.timezone;
        organisationResponse.business_types = !!organisation.business_type ? organisation.business_type.split(',') : [];

        organisationResponse.domains = organisation.domains ? organisation.domains.split(',') : [];

        organisationResponse.created_date = organisation.created_date;
        organisationResponse.updated_date = organisation.updated_date;

        organisationResponse.apiKey = !!organisation.api
            ? ApiKeyResponseTransformer.transformLightWeight(organisation.api)
            : null;
        organisationResponse.apiKeys = !!organisation.apiKeys
            ? ApiKeyResponseTransformer.transformLightWeightMultiple(organisation.apiKeys)
            : null;

        return organisationResponse;
    }

    public static transformList(organisations: Organisation[]): OrganisationResponse[] {
        const response: OrganisationResponse[] = [];
        organisations.forEach((organisation: Organisation): void => {
            response.push(this.transform(organisation));
        });

        return response;
    }
}
