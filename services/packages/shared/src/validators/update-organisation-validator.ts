import * as Yup from 'yup';

import { BusinessType } from '../enum';
import { UserOrganisationService } from '../services';
const businessTypeError = `business_type list should contains at least one value from ${Object.keys(BusinessType).join(
    ', ',
)}`;

export const UpdateOrganisationValidator: Yup.ObjectSchema = Yup.object()
    .shape({
        id: Yup.string().required(),
        name: Yup.string()
            .trim()
            .max(40)
            .required()
            .test('name', 'name should be unique', async function (value) {
                const organisation = (await new UserOrganisationService().getOrganisation({ name: value })).data;
                const id: string = this.resolve(Yup.ref('id'));
                if (organisation && organisation.organisation_id !== id) {
                    return false;
                }

                return true;
            }),
        business_types: Yup.array()
            .test('business_types', businessTypeError, function (values: string[]): boolean | Yup.ValidationError {
                if (!values) {
                    if (!values) {
                        return this.createError({
                            message: 'Business Type is a required field',
                            path: 'business_types',
                        });
                    }
                }
                const isAllBusinessTypeValid = values.every((value) => Object.keys(BusinessType).includes(value));
                return isAllBusinessTypeValid;
            })
            .typeError(businessTypeError)
            .required(),
        domains: Yup.array()
            .test('domains', '', function (values: string[]): boolean | Yup.ValidationError {
                if (!values) {
                    return this.createError({
                        message: 'domains is a required field',
                        path: 'domains',
                    });
                }
                return true;
            })
            .typeError('domains must be a string array')
            .required(),
        timezone: Yup.string().trim().min(3).max(40).required(),
    })
    .required();
