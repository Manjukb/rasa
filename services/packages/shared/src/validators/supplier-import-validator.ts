import * as Yup from 'yup';

export const SupplierImportValidator: Yup.ObjectSchema = Yup.object()
    .shape({
        company_name: Yup.string().trim().required(),
        company_address: Yup.string().trim().required(),
        supplier_name: Yup.string().trim().required(),
        supplier_email: Yup.string().trim().email().required(),
        supplier_phone: Yup.number().required().min(1000000000).max(9999999999),
    })
    .required();

export const SupplierAddUpdateValidator: Yup.ObjectSchema = Yup.object()
    .shape({
        company_name: Yup.string().trim().required(),
        company_address: Yup.string().trim().required(),
        supplier_name: Yup.string().trim().required(),
        supplier_email: Yup.string().trim().email().required(),
        supplier_phone: Yup.number().required().min(1000000000).max(9999999999),
        category_ids: Yup.array().optional(),
        sub_category_ids: Yup.array().optional(),
        product_ids: Yup.array().optional(),
    })
    .required();
