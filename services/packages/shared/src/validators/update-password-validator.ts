import * as Yup from 'yup';

export const UpdatePasswordValidator = Yup.object()
    .shape({
        password: Yup.string().trim().label('password').min(6).max(12).required(),
        confirm_password: Yup.string()
            .oneOf([Yup.ref('password'), null], 'Passwords must match')
            .required(),
    })
    .required();
