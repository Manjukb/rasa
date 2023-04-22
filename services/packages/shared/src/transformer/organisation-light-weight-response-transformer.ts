import { Organisation } from '../database/models';
import { OrganisationLightWeightResponse } from '../viewmodels/response';

export class OrganisationLightWeightResponseTransformer {
    public static transform(organisation: Organisation): OrganisationLightWeightResponse {
        const response = new OrganisationLightWeightResponse();
        if (!organisation) {
            return response;
        }
        response.id = organisation.id;
        response.organisation_id = organisation.organisation_id;
        response.name = organisation.name;
        response.client_type = organisation.client_type || '';
        response.organisation_settings = organisation.organisation_settings;

        return response;
    }
}
