import * as Yup from 'yup';

export const OfferParameterValidator = Yup.object()
    .shape({
        price: Yup.number().moreThan(0).required(),
        quantity: Yup.number().moreThan(0).required(),
    })
    .required();
