import * as Yup from 'yup';

import { RfqStatus } from '../enum/rfq-status';

export const RfqValidator: Yup.ObjectSchema = Yup.object()
    .shape({
        negotiation_process: Yup.object()
            .shape({
                launch_date: Yup.string()
                    .required('Date of release is required field!')
                    .test('launch_date', 'Date of release should be less than base round date', function (value) {
                        const date: string[] = this.resolve(Yup.ref('deadlines'));
                        return value < date[0];
                    }),
                deadlines: Yup.array()
                    .test(
                        'deadlines',
                        `each round date should be > previous round date`,
                        (values: string[]) =>
                            !values.some((date, idx) => {
                                return values[idx - 1] > date ? true : false;
                            }),
                    )
                    .test(
                        'deadlines',
                        'No of deadlines should be equal to no of concession rounds',
                        function (values: string[]) {
                            const noOfRounds = this.resolve(Yup.ref('parameter.max_concession_round'));
                            return noOfRounds !== values.length - 1;
                        },
                    )
                    .required(),
            })
            .when('status', {
                is: RfqStatus.active,
                then: Yup.object().required(),
            })
            .nullable()
            .optional(),
        items: Yup.array()
            .of(
                Yup.object().shape({
                    product_id: Yup.string().required(),
                    baseline_price: Yup.number().moreThan(0).required(),
                    baseline_quantity: Yup.number()
                        .required()
                        .transform((v) => (v === '' || Number.isNaN(v) ? 0 : v))
                        .test('baseline_quantity', 'Quantity is a required field & must be greater than 0', (value) => {
                            return value > 0 ? true : false;
                        }),
                    uom: Yup.string().required(),
                    currency: Yup.string().required(),
                    is_quantity_negotiable: Yup.boolean().required(),
                }),
            )
            .test(
                'items',
                `Manage Categories and Products is a required section to be filled first`,
                (values: any[]) => {
                    return values !== undefined;
                },
            )
            .test('items', `Each product in RFQ should have same currency`, (values: any[]) => {
                return (
                    values !== undefined &&
                    values.every((v) => v.currency.toUpperCase() === values[0].currency.toUpperCase())
                );
            })
            .when('status', {
                is: RfqStatus.active,
                then: Yup.array().required(),
            })
            .nullable()
            .optional(),
        parameter: Yup.object()
            .shape({
                rfq_target_saving: Yup.number().moreThan(0).max(50).optional(),
                max_concession_round: Yup.number().optional(),
                procurement_parameters: Yup.array()
                    .of(
                        Yup.object()
                            .shape({
                                name: Yup.string().optional(),
                                weight: Yup.number().min(0).max(1).optional(),
                                value: Yup.number().min(0).optional(),
                                is_inverse: Yup.boolean().optional(),
                            })
                            .optional(),
                    )
                    .test(
                        'procurement_parameters',
                        `Sum of weights of all parameters should be less than or equal to 100`,
                        function (values: any[]): boolean | Yup.ValidationError {
                            if (values === undefined) {
                                return true;
                            }
                            const sumOfParameters: number = values.reduce((acc, curr) => acc + curr.weight, 0);
                            if (sumOfParameters <= 1) {
                                return true;
                            }
                            return false;
                        },
                    )
                    .optional(),
            })
            .when('status', {
                is: RfqStatus.active,
                then: Yup.object().required(),
            })
            .nullable()
            .optional(),
    })
    .required();

export const RfqUpdateValidator: Yup.ObjectSchema = RfqValidator.shape({
    id: Yup.string().required(),
    rfq_number: Yup.string().required(),
    status: Yup.string().required(),
});
