import * as Yup from 'yup';

import { Roles } from '../enum';
import { UserOrganisationService } from '../services';

export const CreateSettingValidator: Yup.ObjectSchema = Yup.object()
    .shape({
        data: Yup.string()
            .test('data', '', function (value: string): boolean | Yup.ValidationError {
                if (value === '[object Object]') {
                    return true;
                }
                return this.createError({ message: 'Data should be in json format', path: 'data' });
            })
            .required()
            .typeError('Please send json data only'),
        organisation_id: Yup.string()
            .trim()
            .test('organisation_id', '', async function (organisationId: string): Promise<
                boolean | Yup.ValidationError
            > {
                const userRole: string = this.resolve(Yup.ref('auth_user_role'));
                if (userRole !== Roles.super_admin) {
                    return true;
                }

                if (organisationId) {
                    const organisation = (await new UserOrganisationService().getOrganisation({ organisationId })).data;

                    if (!organisation) {
                        return this.createError({ message: 'invalid organisation-id', path: 'organisation_id' });
                    }
                }

                return true;
            })
            .optional(),
    })
    .required();
