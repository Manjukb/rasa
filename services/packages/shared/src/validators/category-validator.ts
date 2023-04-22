import * as Yup from 'yup';

export const CategoryValidator: Yup.ObjectSchema = Yup.object()
    .shape({
        category_name: Yup.string().trim().required(),
        sub_category_name: Yup.string().nullable(),
    })
    .required();

export const CreateCategoryViaWebhookValidator: Yup.ObjectSchema = Yup.object()
    .shape({
        CategoryValidator,
    })
    .required();

export const CreateSubCategoryValidator: Yup.ObjectSchema = Yup.object()
    .shape({
        parent_id: Yup.string().trim().required(),
        name: Yup.string().trim().required(),
    })
    .required();

export const UpdateCategoryValidator: Yup.ObjectSchema = Yup.object()
    .shape({
        id: Yup.string().trim().required(),
        name: Yup.string().trim().required(),
        parent_id: Yup.string().trim().nullable(),
        is_active: Yup.boolean().required(),
    })
    .required();
