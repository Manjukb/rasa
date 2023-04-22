import * as Yup from 'yup';

const productValidator: Yup.ObjectSchema = Yup.object()
    .shape({
        code: Yup.string().required(),
        name: Yup.string().required(),
        category: Yup.string().required(),
        subcategory: Yup.string().required(),
    })
    .required();

const parameterValidator = Yup.object()
    .shape({
        min: Yup.number().required().lessThan(Yup.ref('max')),
        max: Yup.number().required(),
        weight: Yup.number().required().lessThan(1).moreThan(0),
        step: Yup.string().required(),
        unit: Yup.string().required(),
        inverse: Yup.number().integer().min(0).max(1),
    })
    .required();

export { productValidator, parameterValidator };
