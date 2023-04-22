import * as Yup from 'yup';

import { Roles } from '../enum';
import { UserOrganisationService } from '../services';

const whiteListRoles = [Roles.enterprise_admin, Roles.enterprise_user, Roles.saas_admin];

export const UpdateUserValidator: Yup.ObjectSchema = Yup.object()
    .shape({
        id: Yup.string().required(),
        name: Yup.string().trim().max(40).required(),
        role: Yup.string()
            .trim()
            .required()
            .test('role', 'invalid role', function (role): boolean | Yup.ValidationError {
                const authUserRole: string = this.resolve(Yup.ref('auth_user_role'));
                if (
                    authUserRole === Roles.saas_admin &&
                    [Roles.enterprise_admin, Roles.enterprise_user].includes(role)
                ) {
                    return this.createError({
                        message: `Saas Admin can't create Enterprise Admin or User`,
                        path: 'invalid-role',
                    });
                }
                if (authUserRole === Roles.enterprise_admin && role === Roles.saas_admin) {
                    return this.createError({
                        message: `Enterprise Admin can't create Saas Admin `,
                        path: 'invalid-role',
                    });
                }
                if (!whiteListRoles.includes(role)) {
                    return this.createError({
                        message: `role must be one of ${whiteListRoles.join(', ')}`,
                        path: 'invalid-role',
                    });
                }
                return true;
            }),

        email: Yup.string()
            .email()
            .required()
            .test('email', 'email already used', async function (email): Promise<boolean | Yup.ValidationError> {
                if (!email) {
                    return false;
                }
                const id: string = this.resolve(Yup.ref('id'));
                const user = (await new UserOrganisationService().getUser({ email })).data;
                if (user && user.user_id !== id) {
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
