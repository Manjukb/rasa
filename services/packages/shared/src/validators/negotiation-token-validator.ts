import * as Yup from 'yup';

const negotiationTokenValidator: Yup.ObjectSchema = Yup.object()
    .shape({
        api_key: Yup.string().required(),
        referrer: Yup.string().required(),
        customer_id: Yup.string(),
        customer_name: Yup.string(),
    })
    .required();

export { negotiationTokenValidator };
