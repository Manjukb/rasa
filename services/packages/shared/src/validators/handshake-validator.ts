import * as Yup from 'yup';

import { ApiKeyService } from '../services';

export const HandShakeValidator: Yup.ObjectSchema = Yup.object()
    .shape({
        referer: Yup.string().required(),
        api_key: Yup.string()
            .test('api_key', '', async function (apiKey: string): Promise<boolean | Yup.ValidationError> {
                const result = await new ApiKeyService().getDetailByAPIKey(apiKey);

                if (result.errors && result.errors.length) {
                    const error = result.errors[0];

                    return this.createError({ message: error.message, path: 'api_key' });
                }

                const organisation = result.data.organisation;
                const domains = organisation.domains ? organisation.domains.split(',') : [];
                const referer = this.resolve(Yup.ref('referer'));

                if (!domains.includes(referer)) {
                    return this.createError({ message: 'Current domain is not white-listed', path: 'api_key' });
                }

                return true;
            })
            .required(),
    })
    .required();
