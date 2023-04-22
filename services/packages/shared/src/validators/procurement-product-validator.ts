import * as Yup from 'yup';

export const ProcurementCreateProductValidator: Yup.ObjectSchema = Yup.object()
    .shape({
        name: Yup.string().trim().required(),
        category: Yup.string().required(),
        subcategory: Yup.string().nullable(),
        product_code: Yup.string().nullable(),
        description_1: Yup.string().nullable(),
        description_2: Yup.string().nullable(),
        uom: Yup.string().min(2).max(16).required(),
        currency: Yup.string().min(2).max(16).required(),
        price: Yup.number().moreThan(0).required(),
    })
    .required();

export const ProcurementUpdateProductValidator: Yup.ObjectSchema = Yup.object()
    .shape({
        id: Yup.string().trim().required(),
        name: Yup.string().trim().required(),
        category_id: Yup.string().required(),
        sub_category_id: Yup.string().nullable(),
        product_code: Yup.string().nullable(),
        description_1: Yup.string().nullable(),
        description_2: Yup.string().nullable(),
        uom: Yup.string().min(2).max(16).required(),
        currency: Yup.string().min(2).max(16).required(),
        price: Yup.number().moreThan(0).required(),
        is_active: Yup.boolean().required(),
    })
    .required();
