import { ApiKeyResponse, LightWeightApiKeyResponse } from '../viewmodels/response';

import { ApiKey } from '../database/models';
import { OrganisationLightWeightResponseTransformer } from './organisation-light-weight-response-transformer';

export class ApiKeyResponseTransformer {
    public static transform(apiKey: ApiKey): ApiKeyResponse {
        const response = new ApiKeyResponse();
        response.id = apiKey.id;
        response.api_key = apiKey.api_key;
        response.issued_date = apiKey.issued_date;
        response.expired_date = apiKey.expired_date;
        response.organisation_id = apiKey.organisation_id;
        response.business_type = apiKey.business_type;
        response.organisation = OrganisationLightWeightResponseTransformer.transform(apiKey.organisation);

        return response;
    }

    public static transformMultiple(apiKeys: ApiKey[]): ApiKeyResponse[] {
        const response = apiKeys.map(
            (apiKey: ApiKey): ApiKeyResponse => {
                return this.transform(apiKey);
            },
        );

        return response;
    }

    public static transformLightWeight(apiKey: ApiKey): LightWeightApiKeyResponse {
        const response: LightWeightApiKeyResponse = {
            api_key: apiKey.api_key,
            issued_date: apiKey.issued_date,
            business_type: apiKey.business_type,
            expired_date: apiKey.expired_date,
        };

        return response;
    }

    public static transformLightWeightMultiple(apiKeys: ApiKey[]): LightWeightApiKeyResponse[] {
        const response = apiKeys.map(
            (apiKey: ApiKey): LightWeightApiKeyResponse => {
                return this.transformLightWeight(apiKey);
            },
        );

        return response;
    }
}
