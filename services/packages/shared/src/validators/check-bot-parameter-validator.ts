import * as Yup from 'yup';

import { ApiKeyServiceContract } from '../services';
import { Bootstrapper } from '../bootstrap/bootstrapper';
import { ClientType } from '../enum';

export const CheckBotParameterValidator: Yup.ObjectSchema = Yup.object()
    .shape({
        referer: Yup.string().required(),
        product_id: Yup.string().required(),
        api_key: Yup.string()
            .test('api_key', '', async function (apiKey: string): Promise<boolean | Yup.ValidationError> {
                const service = Bootstrapper.getContainer().get<ApiKeyServiceContract>('ApiKeyService');
                const result = await service.getDetailByAPIKey(apiKey);

                if (result.errors && result.errors.length) {
                    const error = result.errors[0];

                    return this.createError({ message: error.message, path: 'api_key' });
                }

                const organisation = result.data.organisation;
                const clientType = organisation.client_type;
                const tenantId = this.resolve(Yup.ref('tenant_id'));

                if (clientType === ClientType['saas-based'] && !tenantId) {
                    return this.createError({ message: 'Tenant id is required', path: 'tenant_id' });
                }

                const domains = organisation.domains ? organisation.domains.split(',') : [];
                const referer = this.resolve(Yup.ref('referer'));

                if (!domains.includes(referer)) {
                    return this.createError({ message: 'Current domain is not white-listed', path: 'api_key' });
                }

                return true;
            })
            .required('Api Key is required'),
    })
    .required();
