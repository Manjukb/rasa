import * as Yup from 'yup';

import { BusinessType, TenantUserRole } from '../enum';

export const SaasEmbedValidator: Yup.ObjectSchema = Yup.object()
    .shape({
        tenant_id: Yup.string().trim().max(40).required(),
        tenant_name: Yup.string().trim().max(100).required(),
        tenant_type: Yup.string()
            .trim()
            .oneOf([BusinessType.collections, BusinessType.procurement, BusinessType.sales])
            .required(),
    })
    .required();

export const SaasUserEmbedValidator = SaasEmbedValidator.shape({
    user_name: Yup.string().trim().max(100).required(),
    user_identifier: Yup.string().trim().max(100).required(),
    user_role: Yup.string().trim().oneOf([TenantUserRole.admin, TenantUserRole.user]).required(),
}).required();

export const CustomerSaasEmbedValidator: Yup.ObjectSchema = SaasEmbedValidator.shape({
    customer_id: Yup.string().trim().max(64).required(),
    customer_name: Yup.string().required(),
}).required();

export const CustomerEmbedValidator = Yup.object()
    .shape({
        customer_id: Yup.string().trim().max(64).required(),
        customer_name: Yup.string().required(),
    })
    .required();
