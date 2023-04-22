import * as Yup from 'yup';

type CustomValidationError = {
    message: string;
    path: string;
};

function minValueValidator(value: number, minValue: number, fieldName: string): boolean | CustomValidationError {
    if (value < minValue) {
        return {
            message: `${fieldName} can't be less than 0`,
            path: fieldName,
        };
    }

    return true;
}

function maxValueValidator(value: number, maxValue: number, fieldName: string): boolean | CustomValidationError {
    if (value > maxValue) {
        return {
            message: `${fieldName} can't be greater than ${maxValue}`,
            path: fieldName,
        };
    }

    return true;
}

export const ProcurementBotParameterValidator = Yup.object()
    .shape({
        max_concession_round: Yup.number()
            .required()
            .test('max_concession_round', '', function (value: number): boolean | Yup.ValidationError {
                const minValueValidatorResponse = minValueValidator(value, 0, 'max_concession_round');
                const maxValueValidatorResponse = maxValueValidator(value, 5, 'max_concession_round');

                if (minValueValidatorResponse !== true) {
                    return this.createError({ ...minValueValidatorResponse });
                }

                if (maxValueValidatorResponse !== true) {
                    return this.createError({ ...maxValueValidatorResponse });
                }

                return true;
            }),

        concession_pattern: Yup.array().test('concession_pattern', '', function (values: number[]):
            | boolean
            | Yup.ValidationError {
            if (!values) {
                return this.createError({ message: 'concession_pattern is required', path: 'concession_pattern' });
            }
            const length = values.length;
            const round: number = this.resolve(Yup.ref('max_concession_round'));

            if (length !== round) {
                return this.createError({
                    message: 'concession_pattern numbers should be equal to max_concession_round',
                    path: 'concession_pattern',
                });
            }

            const hasSomeNonNumbers = values.some((value) => typeof value !== 'number');

            if (hasSomeNonNumbers) {
                return this.createError({
                    message: 'concession_pattern should contain only number values',
                    path: 'concession_pattern',
                });
            }

            return true;
        }),
        procurement_parameters: Yup.array()
            .of(
                Yup.object()
                    .shape({
                        name: Yup.string().required(),
                        weight: Yup.number().min(0).max(1).required(),
                        value: Yup.number().min(0).optional(),
                        is_inverse: Yup.boolean().optional(),
                    })
                    .optional(),
            )
            .test(
                'procurement_parameters',
                `Sum of weights of all parameters should be less than or equal to 100`,
                function (values: any[]): boolean | Yup.ValidationError {
                    const quantity = this.resolve(Yup.ref('quantity'));
                    let sumOfParameters: number = values.reduce((acc, curr) => acc + curr.weight, 0);
                    if (quantity !== undefined && Number(quantity.weight) > 0) {
                        sumOfParameters = sumOfParameters + Number(quantity.weight);
                    }
                    if (sumOfParameters <= 1) {
                        return true;
                    }
                    return false;
                },
            )
            .optional(),
        supplier_parameters: Yup.object()
            .shape({
                min_numbers_of_supplier: Yup.number().moreThan(0).optional(),
                time_to_respond: Yup.object()
                    .shape({
                        contract: Yup.number().moreThan(0).max(30).optional(),
                        spot: Yup.number().moreThan(0).max(30).optional(),
                    })
                    .optional(),
                time_to_award: Yup.object()
                    .shape({
                        contract: Yup.number().moreThan(0).max(90).optional(),
                        spot: Yup.number().moreThan(0).max(90).optional(),
                    })
                    .optional(),
            })
            .optional(),
        category_ids: Yup.array().of(Yup.string()).optional(),
    })
    .required();
