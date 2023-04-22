import * as Yup from 'yup';

export const ProductValidator: Yup.ObjectSchema = Yup.object()
    .shape({
        name: Yup.string().trim().required(),
        category: Yup.string().required(),
        sub_category: Yup.string().nullable(),
        product_code: Yup.string().nullable(),
        description_1: Yup.string().nullable(),
        description_2: Yup.string().nullable(),
    })
    .required();

export const SaasProductValidator: Yup.ObjectSchema = Yup.object()
    .shape({
        organisation_id: Yup.string().trim().nullable(),
        name: Yup.string().trim().required(),
        category: Yup.string().required(),
        sub_category: Yup.string().nullable(),
        uom: Yup.string().nullable(),
        product_code: Yup.string().nullable(),
        description_1: Yup.string().nullable(),
        description_2: Yup.string().nullable(),
        is_active: Yup.boolean().nullable(),
        price: Yup.number().moreThan(0).nullable(),
        currency: Yup.string().nullable(),
    })
    .required();

export const CreateProductValidator: Yup.ObjectSchema = Yup.object()
    .shape({
        name: Yup.string().trim().required(),
        category_id: Yup.string().required(),
        sub_category_id: Yup.string().nullable(),
        uom: Yup.string().required(),
        product_code: Yup.string().required(),
        description_1: Yup.string().required(),
        description_2: Yup.string().nullable(),
        is_active: Yup.boolean().required(),
        price: Yup.number().moreThan(0).required(),
        currency: Yup.string().required(),
    })
    .required();

export const UpdateProductValidator: Yup.ObjectSchema = Yup.object()
    .shape({
        id: Yup.string().trim().required(),
        name: Yup.string().trim().required(),
        category_id: Yup.string().required(),
        sub_category_id: Yup.string().nullable(),
        product_code: Yup.string().nullable(),
        description_1: Yup.string().nullable(),
        description_2: Yup.string().nullable(),
        is_active: Yup.boolean().required(),
    })
    .required();
