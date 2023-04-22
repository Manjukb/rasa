import * as Yup from 'yup';

import { BusinessType, ClientType } from '../enum';

import { AdminInfoValidator } from './admin-info-validator';
import { UserOrganisationService } from '../services';

const businessTypeError = `business_type list should contains at least one value from ${Object.keys(BusinessType).join(
    ', ',
)}`;
const clientTypeError = `client type list should contains one value from ${Object.keys(ClientType).join(', ')}`;

export const CreateOrganisationWithAdminValidator: Yup.ObjectSchema = Yup.object()
    .shape({
        name: Yup.string()
            .trim()
            .max(40)
            .required()
            .test(
                'name',
                'name should be unique',
                async (value): Promise<boolean | Yup.ValidationError> => {
                    if (!value) {
                        return false;
                    }
                    const organisation = (await new UserOrganisationService().getOrganisation({ name: value })).data;

                    return !!!organisation;
                },
            ),
        client_type: Yup.mixed().oneOf(Object.keys(ClientType), clientTypeError).required(),
        business_types: Yup.array()
            .test('business_types', businessTypeError, function (values: string[]): boolean | Yup.ValidationError {
                if (!values) {
                    return this.createError({ message: 'Business Type is a required field', path: 'business_types' });
                }
                const status = values.every((value) => Object.keys(BusinessType).includes(value));
                return status;
            })
            .typeError(businessTypeError)
            .required(),
        admin: AdminInfoValidator,
        domains: Yup.array()
            .test('domains', '', function (values: string[]): boolean | Yup.ValidationError {
                if (!values) {
                    return true;
                }

                return true;
            })
            .typeError('domains must be a string array')
            .required(),
        timezone: Yup.string().trim().min(3).max(40).required(),
    })
    .required();
