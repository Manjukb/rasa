import * as Yup from 'yup';

export const ForgotPasswordValidator = Yup.object()
    .shape({
        email: Yup.string().trim().email().label('Email').required(),
    })
    .required();
