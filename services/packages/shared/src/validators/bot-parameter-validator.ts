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

export const BotParameterValidator = Yup.object()
    .shape({
        min_accept_score: Yup.number()
            .required()
            .test('min_accept_score', '', async function (value: number): Promise<boolean | Yup.ValidationError> {
                const minValueValidatorResponse = minValueValidator(value, 0, 'min_accept_score');

                if (minValueValidatorResponse !== true) {
                    return this.createError({ ...minValueValidatorResponse });
                }

                const maxValueValidatorResponse = maxValueValidator(value, 1, 'min_accept_score');

                if (maxValueValidatorResponse !== true) {
                    return this.createError({ ...maxValueValidatorResponse });
                }

                return true;
            }),

        auto_accept_score: Yup.number()
            .required()
            .test('auto_accept_score', '', function (value: number): boolean | Yup.ValidationError {
                const minValueValidatorResponse = minValueValidator(value, 0, 'auto_accept_score');
                const maxValueValidatorResponse = maxValueValidator(value, 1, 'auto_accept_score');

                if (minValueValidatorResponse !== true) {
                    return this.createError({ ...minValueValidatorResponse });
                }

                if (maxValueValidatorResponse !== true) {
                    return this.createError({ ...maxValueValidatorResponse });
                }

                return true;
            }),

        counter_offers: Yup.number()
            .required()
            .test('counter_offers', '', function (value: number): boolean | Yup.ValidationError {
                const minValueValidatorResponse = minValueValidator(value, 0, 'counter_offers');
                const maxValueValidatorResponse = maxValueValidator(value, 16, 'counter_offers');

                if (minValueValidatorResponse !== true) {
                    return this.createError({ ...minValueValidatorResponse });
                }

                if (maxValueValidatorResponse !== true) {
                    return this.createError({ ...maxValueValidatorResponse });
                }

                return true;
            }),

        max_concession_score: Yup.number()
            .required()
            .test('max_concession_score', '', function (value: number): boolean | Yup.ValidationError {
                const minValueValidatorResponse = minValueValidator(value, 0, 'max_concession_score');
                const maxValueValidatorResponse = maxValueValidator(value, 1, 'max_concession_score');

                if (minValueValidatorResponse !== true) {
                    return this.createError({ ...minValueValidatorResponse });
                }

                if (maxValueValidatorResponse !== true) {
                    return this.createError({ ...maxValueValidatorResponse });
                }

                return true;
            }),

        max_concession_round: Yup.number()
            .required()
            .test('max_concession_round', '', function (value: number): boolean | Yup.ValidationError {
                const minValueValidatorResponse = minValueValidator(value, 0, 'max_concession_round');
                const maxValueValidatorResponse = maxValueValidator(value, 16, 'max_concession_round');

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

            const isAllNumbers = values.every((value) => typeof value === 'number');

            if (!isAllNumbers) {
                return this.createError({
                    message: 'concession_pattern should contain only number values',
                    path: 'concession_pattern',
                });
            }

            return true;
        }),
    })
    .required();
