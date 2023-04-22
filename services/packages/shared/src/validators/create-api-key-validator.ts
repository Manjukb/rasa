import * as Yup from 'yup';

import { RoleService, UserOrganisationService } from '../services';

import { RequestUserResponse } from '../viewmodels/response';

type CustomValidationError = {
    message: string;
    path: string;
};

const validateBusinessType = async (
    organisationId: string,
    businessType: string,
): Promise<boolean | CustomValidationError> => {
    const userOrganisation = await new UserOrganisationService().getOrganisation({ organisationId });

    if (userOrganisation.errors && userOrganisation.errors.length) {
        return { message: 'Invalid Organisation Id', path: 'organisation_id' };
    }

    const businessTypes = userOrganisation.data.business_type ? userOrganisation.data.business_type.split(',') : [];

    if (!businessTypes.length) {
        return {
            message: 'Business type is not defined for user organisation',
            path: 'business_type',
        };
    }

    if (!businessTypes.includes(businessType)) {
        return {
            message: `Business type should be one from ${businessTypes.join(', ')}`,
            path: 'business_type',
        };
    }

    return true;
};

export const CreateApiKeyValidator: Yup.ObjectSchema = Yup.object()
    .shape({
        business_type: Yup.string()
            .test('business_type', 'business_type is required', async function (value: string): Promise<
                boolean | Yup.ValidationError
            > {
                if (!value) {
                    return this.createError({ message: 'business_type is required', path: 'business_type' });
                }
                const user: RequestUserResponse = this.resolve(Yup.ref('user'));
                const isAdmin = new RoleService().isSuperAdmin(user);

                if (!isAdmin) {
                    const isBusinessTypeValid = await validateBusinessType(user.organisation_id, value);
                    if (isBusinessTypeValid !== true) {
                        return this.createError({ ...isBusinessTypeValid });
                    }
                }

                return true;
            })
            .required(),
        organisation_id: Yup.string()
            .trim()
            .test('organisation_id', '', async function (organisationId: string): Promise<
                boolean | Yup.ValidationError
            > {
                const user: RequestUserResponse = this.resolve(Yup.ref('user'));
                const isSuperAdmin = new RoleService().isSuperAdmin(user);

                if (!isSuperAdmin) {
                    return true;
                }

                if (!organisationId) {
                    return this.createError({ message: 'organisation is required', path: 'organisation_id' });
                }

                const businessType = this.resolve(Yup.ref('business_type'));

                const isBusinessTypeValid = await validateBusinessType(organisationId, businessType);

                if (isBusinessTypeValid !== true) {
                    return this.createError({ ...isBusinessTypeValid });
                }

                return true;
            })
            .optional(),
    })
    .required();
