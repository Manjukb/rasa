import * as Yup from 'yup';

export const RfqCommentValidator: Yup.ObjectSchema = Yup.object()
    .shape({
        comment: Yup.string().required('Please input comment'),
    })
    .required();
