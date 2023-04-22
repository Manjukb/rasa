import * as Yup from 'yup';

import { UserOrganisationService } from '../services';

export const CreateEnterpriseUserValidator: Yup.ObjectSchema = Yup.object()
    .shape({
        name: Yup.string().trim().max(40).required(),
        email: Yup.string()
            .email()
            .required()
            .test('email', 'email already used', async function (email): Promise<boolean | Yup.ValidationError> {
                if (!email) {
                    return false;
                }

                const user = await new UserOrganisationService().getUser({ email });
                if (user && user.data) {
                    return false;
                }

                return true;
            }),

        business_types: Yup.array()
            .test('business_types', '', async function (values: string[]): Promise<boolean | Yup.ValidationError> {
                if (!values) {
                    return this.createError({ message: 'required', path: 'business_types' });
                }

                const organisationId: string = this.resolve(Yup.ref('auth_user_organisation_id'));
                const userOrganisation = (await new UserOrganisationService().getOrganisation({ organisationId })).data;

                if (userOrganisation) {
                    if (!userOrganisation.business_type) {
                        return this.createError({
                            message: `Organisation hasn't defined any business type`,
                            path: 'business_types',
                        });
                    }

                    const businessTypes = userOrganisation.business_type.split(',');
                    const isValidBusinessTypes = values.every((value) => businessTypes.includes(value));

                    if (!isValidBusinessTypes) {
                        return this.createError({
                            message: `business types should contains only values from ${userOrganisation.business_type}`,
                            path: 'business_types',
                        });
                    }

                    return isValidBusinessTypes;
                }
            })
            .typeError(`business types should be string array like ['sales', 'collection', 'procurement']`)
            .required(),
    })
    .required();
