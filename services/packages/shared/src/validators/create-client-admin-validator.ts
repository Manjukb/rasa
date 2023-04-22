import * as Yup from 'yup';

import { UserOrganisationService } from '../services';

export const CreateClientAdminValidator: Yup.ObjectSchema = Yup.object()
    .shape({
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

        organisation_id: Yup.string()
            .required()
            .test(
                'organisation_id',
                'organisation_id is not valid',
                async (value): Promise<boolean> => {
                    const organisation = await new UserOrganisationService().getOrganisation({ organisationId: value });
                    if (organisation && organisation.data) {
                        return true;
                    }

                    return false;
                },
            ),
        name: Yup.string().max(40).min(3).required(),
    })
    .required();
