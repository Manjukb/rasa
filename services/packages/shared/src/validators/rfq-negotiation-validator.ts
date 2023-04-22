import * as Yup from 'yup';

export const RfqNegotiationValidator: Yup.ObjectSchema = Yup.object()
    .shape({
        rfq_items: Yup.array()
            .of(
                Yup.object().shape({
                    baseline_price: Yup.number().moreThan(0).required('Proposed Price is a required field'),
                    baseline_quantity: Yup.number().moreThan(0).required('Proposed Quantity is a required field'),
                }),
            )
            .required(),
    })
    .required();
