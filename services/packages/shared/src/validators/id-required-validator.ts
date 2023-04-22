import * as Yup from 'yup';

export const IdRequiredValidator: Yup.ObjectSchema = Yup.object()
    .shape({
        id: Yup.string().trim().required(),
    })
    .required();
