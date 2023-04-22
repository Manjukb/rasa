import * as Yup from 'yup';

export const AgentMakeOfferValidator: Yup.ObjectSchema = Yup.object()
    .shape({
        session_id: Yup.string().trim().required(),
        payload: Yup.object({ rfq_items: Yup.array(), rfq_parameters: Yup.array() }).required(),
        // price: Yup.number().moreThan(0).required(),
        // quantity: Yup.number().moreThan(0).required(),
    })
    .required();
