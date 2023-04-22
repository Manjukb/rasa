import * as Yup from 'yup';

import { Roles } from '../enum';
import { UserOrganisationService } from '../services';

export const CreateRfqValidator: Yup.ObjectSchema = Yup.object()
    .shape({
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
        target_saving_rate: Yup.number().moreThan(0).lessThan(100).required(),
        payment_terms: Yup.object().shape({
            baseline_value: Yup.number().required(),
            is_negotiable: Yup.boolean().required(),
        }),
        contract_terms: Yup.object().shape({
            baseline_value: Yup.number().required(),
            is_negotiable: Yup.boolean().required(),
        }),
        rfq_items: Yup.array()
            .of(
                Yup.object()
                    .shape({
                        product_id: Yup.string().required(),
                        baseline_price: Yup.number().moreThan(0).required(),
                        baseline_quantity: Yup.number().moreThan(0).required(),
                        uom: Yup.string().required(),
                        is_quantity_negotiable: Yup.boolean().required(),
                    })
                    .required(),
            )
            .required(),
        rfq_suppliers: Yup.array()
            .of(
                Yup.object()
                    .shape({
                        user_id: Yup.string().required(),
                        send_mail: Yup.boolean().required(),
                    })
                    .required(),
            )
            .required(),
        send_rfq_mail: Yup.boolean().required(),
    })
    .required();
