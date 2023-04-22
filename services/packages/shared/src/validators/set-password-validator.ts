import * as Yup from 'yup';

export const SetPasswordValidator = Yup.object()
    .shape({
        password_key: Yup.string().trim().label('password-key').required(),
        password: Yup.string().trim().label('password').min(6).max(12).required(),
        confirm_password: Yup.string()
            .oneOf([Yup.ref('password'), null], 'Passwords must match')
            .required(),
    })
    .required();
