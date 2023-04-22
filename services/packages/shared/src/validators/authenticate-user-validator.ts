import * as Yup from 'yup';

export const AuthenticateUserValidator = Yup.object()
    .shape({
        email: Yup.string().trim().email().label('Email').required(),
        password: Yup.string().trim().min(5).label('Password').required(),
    })
    .required();
