import * as Yup from 'yup';

import { BusinessType, Roles } from '../enum';
import { TenantServiceContract, UserOrganisationServiceContract } from '../services';

import { Bootstrapper } from '../bootstrap/bootstrapper';
import { ProcurementBotParameterValidator } from './procuremnt-bot-parameter-validator';

export const CreateBotValidator: Yup.ObjectSchema = Yup.object()
    .shape({
        organisation_id: Yup.string()
            .trim()
            .test('organisation_id', '', async function (organisationId: string): Promise<
                boolean | Yup.ValidationError
            > {
                const userRole: string = this.resolve(Yup.ref('auth_user_role'));
                if (userRole !== Roles.super_admin) {
                    return true;
                }
                if (!organisationId) {
                    return this.createError({ message: 'organisation is required', path: 'organisation_id' });
                }
                const userOrganisationService = Bootstrapper.getContainer().get<UserOrganisationServiceContract>(
                    'UserOrganisationService',
                );
                const organisation = (await userOrganisationService.getOrganisation({ organisationId })).data;

                if (!organisation) {
                    return this.createError({ message: 'invalid organisation-id', path: 'organisation_id' });
                }

                return true;
            })
            .optional(),
        business_type: Yup.string()
            .test('business_type', '', async function (value: string): Promise<boolean | Yup.ValidationError> {
                if (!value) {
                    return this.createError({ message: 'required', path: 'business_type' });
                }

                let organisationId: string = this.resolve(Yup.ref('auth_user_organisation_id'));
                const tenantId: string = this.resolve(Yup.ref('auth_user_tenant_id'));
                const userRole: string = this.resolve(Yup.ref('auth_user_role'));

                if (userRole === Roles.super_admin) {
                    organisationId = this.resolve(Yup.ref('organisation_id'));
                }

                if (!organisationId) {
                    return this.createError({
                        message: 'business type can be set on the basis of organisation.',
                        path: 'business_type',
                    });
                }
                const container = Bootstrapper.getContainer();
                const userOrganisationService = container.get<UserOrganisationServiceContract>(
                    'UserOrganisationService',
                );
                const tenantService = Bootstrapper.getContainer().get<TenantServiceContract>('TenantService');

                if (tenantId) {
                    const tenant = (await tenantService.get(tenantId)).data;
                    if (tenant && tenant.business_type !== value) {
                        return this.createError({
                            message: `Bot can be created only for '${tenant.business_type}' business type `,
                            path: 'business_type',
                        });
                    }

                    return true;
                }

                const userOrganisation = (await userOrganisationService.getOrganisation({ organisationId })).data;

                if (!userOrganisation) {
                    return this.createError({
                        message: 'organisation_id is invalid',
                        path: 'business_type',
                    });
                }

                if (userOrganisation) {
                    if (!userOrganisation.business_type) {
                        return this.createError({
                            message: `Organisation hasn't defined any business type`,
                            path: 'business_types',
                        });
                    }

                    const businessTypes = userOrganisation.business_type.split(',').map((b) => b.trim());
                    const isValidBusinessTypes = businessTypes.includes(value);

                    if (!isValidBusinessTypes) {
                        return this.createError({
                            message: `business type should be one out of ${userOrganisation.business_type}`,
                            path: 'business_type',
                        });
                    }

                    return isValidBusinessTypes;
                }
            })
            .typeError(`business types should be string array like ['sales', 'collection', 'procurement']`)
            .required(),
        parameter: Yup.object().when('business_type', (business_type: string) => {
            const businessTypes: string[] = [BusinessType.sales, BusinessType.procurement];
            if (businessTypes.includes(business_type)) {
                return ProcurementBotParameterValidator;
            }
        }),
        category_ids: Yup.array().optional(),
    })
    .required();
