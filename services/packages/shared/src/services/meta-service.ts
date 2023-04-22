import { BotParameterCheckResponse, BotSchemaResponse } from '../viewmodels/response';

import { BusinessType } from '../enum';
import { Constant } from '../helpers';
import { ErrorModel, ResponseViewModel } from '../viewmodels/response-viewmodel';
import { injectable, inject } from 'inversify';
import { ApiKeyServiceContract } from './api-key-service';
import { ProductServiceContract } from './product-service';
import { CheckBotParameterRequest } from '../viewmodels/requests';
import { BotServiceContract } from './bot-service';
import { ProductParameterServiceContract } from './product-parameter-service';
import { TenantServiceContract } from './tenant-service';
import { TenantResponse } from '../viewmodels/response/tenant-response';
import { BotMessagesSchemaResponse } from '../viewmodels/response/bot-schema-response';

export interface MetaServiceContract {
    botSchema(): ResponseViewModel<BotSchemaResponse>;
    salesBotSchema(): ResponseViewModel<BotSchemaResponse>;
    procurementBotMessages(): ResponseViewModel<BotMessagesSchemaResponse>;
    salesBotMessages(): ResponseViewModel<BotMessagesSchemaResponse>;
    getBotAndParamsStatus(request: CheckBotParameterRequest): Promise<ResponseViewModel<BotParameterCheckResponse>>;
}

@injectable()
export class MetaService implements MetaServiceContract {
    public constructor(
        @inject('ApiKeyService') private readonly apiKeyService: ApiKeyServiceContract,
        @inject('BotService') private readonly botService: BotServiceContract,
        @inject('ProductService') private readonly productService: ProductServiceContract,
        @inject('ProductParameterService') private readonly productParameterService: ProductParameterServiceContract,
        @inject('TenantService') private readonly tenantService: TenantServiceContract,
    ) {}
    public botSchema(): ResponseViewModel<BotSchemaResponse> {
        const response = new ResponseViewModel<BotSchemaResponse>();

        response.data = {
            max_concession_round: { type: Constant.botSchemaFieldsTypes.number, min: 1, max: 16, required: true },
            max_concession_score: { type: Constant.botSchemaFieldsTypes.number, min: 0, max: 1, required: true },
            min_accept_score: { type: Constant.botSchemaFieldsTypes.number, min: 0, max: 1, required: true },
            auto_accept_score: { type: Constant.botSchemaFieldsTypes.number, min: 0, max: 1, required: true },
            concession_pattern: {
                type: Constant.botSchemaFieldsTypes.array,
                values: [30, 20, 10, 5, 5],
                required: true,
                items: { type: Constant.botSchemaFieldsTypes.number, min: 0, max: 1, required: true },
            },
            negotiation_round: { type: Constant.botSchemaFieldsTypes.number, min: 1, max: 16, required: true },
            counter_offers: { type: Constant.botSchemaFieldsTypes.number, min: 1, max: 16, default: 4, required: true },
            business_type: {
                type: Constant.botSchemaFieldsTypes.string,
                enum: [BusinessType.collections, BusinessType.procurement, BusinessType.sales],
                required: true,
            },
            procurement_parameters: [
                {
                    name: 'payment_terms',
                    label: 'Payment Terms',
                    is_inverse: false, // lower is better
                    type: 'number',
                    parameters: {
                        weight: {
                            label: 'Weight',
                            min: 0,
                            max: 1,
                            type: 'number',
                            disabled: false,
                        },
                        value: {
                            label: 'Range',
                            min: 0,
                            max: 90,
                            unit: 'Days',
                            type: 'slider',
                            step: 15,
                            disabled: false,
                        },
                    },
                },
                {
                    name: 'contract_terms',
                    label: 'Term of contract',
                    is_inverse: true, // higher is better
                    type: 'number',
                    parameters: {
                        weight: {
                            label: 'Weight',
                            min: 0,
                            max: 1,
                            type: 'number',
                            disabled: false,
                        },
                        value: {
                            label: 'Range',
                            min: 3,
                            max: 24,
                            unit: 'Months',
                            type: 'slider',
                            step: 3,
                            disabled: false,
                        },
                    },
                },
                {
                    name: 'on_demand_delivery',
                    label: 'On demand delivery',
                    is_inverse: false,
                    parameters: {
                        weight: {
                            label: 'Weight',
                            min: 0,
                            max: 1,
                            type: 'number',
                            disabled: false,
                        },
                    },
                    type: 'checkbox',
                },
            ],
        };

        return response;
    }

    public salesBotSchema(): ResponseViewModel<BotSchemaResponse> {
        const response = new ResponseViewModel<BotSchemaResponse>();

        response.data = {
            max_concession_round: { type: Constant.botSchemaFieldsTypes.number, min: 1, max: 16, required: true },
            max_concession_score: { type: Constant.botSchemaFieldsTypes.number, min: 0, max: 1, required: true },
            min_accept_score: { type: Constant.botSchemaFieldsTypes.number, min: 0, max: 1, required: true },
            auto_accept_score: { type: Constant.botSchemaFieldsTypes.number, min: 0, max: 1, required: true },
            concession_pattern: {
                type: Constant.botSchemaFieldsTypes.array,
                values: [40, 30, 20, 10, 10],
                required: true,
                items: { type: Constant.botSchemaFieldsTypes.number, min: 0, max: 1, required: true },
            },
            negotiation_round: { type: Constant.botSchemaFieldsTypes.number, min: 1, max: 16, required: true },
            counter_offers: { type: Constant.botSchemaFieldsTypes.number, min: 1, max: 16, default: 4, required: true },
            business_type: {
                type: Constant.botSchemaFieldsTypes.string,
                enum: [BusinessType.collections, BusinessType.procurement, BusinessType.sales],
                required: true,
            },
            procurement_parameters: [
                {
                    name: 'payment_terms',
                    label: 'Payment Terms',
                    is_inverse: true, // lower is better
                    type: 'number',
                    parameters: {
                        weight: {
                            label: 'Weight',
                            min: 0,
                            max: 1,
                            type: 'number',
                            disabled: false,
                        },
                        value: {
                            label: 'Range',
                            min: 0,
                            max: 60,
                            unit: 'Days',
                            type: 'slider',
                            step: 15,
                            disabled: false,
                        },
                    },
                },
                {
                    name: 'contract_terms',
                    label: 'Term of contract',
                    is_inverse: false, // higher is better
                    type: 'number',
                    parameters: {
                        weight: {
                            label: 'Weight',
                            min: 0,
                            max: 1,
                            type: 'number',
                            disabled: false,
                        },
                        value: {
                            label: 'Range',
                            min: 3,
                            max: 24,
                            unit: 'Months',
                            type: 'slider',
                            step: 3,
                            disabled: false,
                        },
                    },
                },
                {
                    name: 'on_demand_delivery',
                    label: 'On demand delivery',
                    is_inverse: false,
                    parameters: {
                        weight: {
                            label: 'Weight',
                            min: 0,
                            max: 1,
                            type: 'number',
                            disabled: false,
                        },
                    },
                    type: 'checkbox',
                },
            ],
        };

        return response;
    }
    public salesBotMessages(): ResponseViewModel<BotMessagesSchemaResponse> {
        const response = new ResponseViewModel<BotMessagesSchemaResponse>();

        response.data = {
            first: [
                "Hmmm...that's a bit low. How about this?",
                'Thanks, however I am afraid this is bit low. Can you please consider this offer?',
                'Appreciate your offer! But will you accept this offer ?',
            ],
            mid: [
                'I am afraid your offer is still on the lower side. Let me improve my offer',
                'We seem to be closing in on a deal. How about this?',
                'We are keen to make this deal happen. How about this offer?',
                'I am afraid that we can’t match this offer. How about this instead?',
                'I don’t think we can offer you this price. Would you consider this offer instead?',
                'I don’t think this offer is possible. Will you be ok with this alternative offer instead?',
                'We are close to striking a deal. How about this?',
                'Thanks for your patience. Does this offer work for you?',
                'We are so close to an agreement. What do you think about this offer?',
            ],
            last: [
                "I really hope we can agree on this. Here's my final offer:",
                'Hope we can do business today! Here is my best offer',
                "We have really done our best. I can't go below this offer:",
            ],
        };

        return response;
    }

    public procurementBotMessages(): ResponseViewModel<BotMessagesSchemaResponse> {
        const response = new ResponseViewModel<BotMessagesSchemaResponse>();

        response.data = {
            first: [
                'Thanks, however I am afraid this is a bit high. Can you please consider this offer?',
                'Appreciate your offer! But will you accept this offer?',
            ],
            mid: [
                'I am afraid your offer is still on the higher side. Let me improve my offer',
                'We seem to be closing in on a deal. How about this?',
                'We are keen to make this deal happen. How about this offer?',
                'I am afraid your offer is still on the higher side. What do you think about this offer?',
                'We seem to be closing in on a deal. How about this?',
                'We are keen to make this deal happen. How about this offer?',
                'We are close to striking a deal. How about this?',
                'Thanks for your patience. Does this offer work for you?',
                'We are so close to an agreement. Does this offer work for you?',
            ],
            last: [
                "I really hope we can agree on this. Here's my final offer:",
                'Hope we can do business today! Here is my best offer',
                "We have really done our best. I can't go higher than this offer:",
            ],
        };

        return response;
    }

    public async getBotAndParamsStatus(
        request: CheckBotParameterRequest,
    ): Promise<ResponseViewModel<BotParameterCheckResponse>> {
        const response = new ResponseViewModel<BotParameterCheckResponse>();
        const apiKeyResponse = await this.apiKeyService.getDetailByAPIKey(request.api_key);
        const organisation = apiKeyResponse.data.organisation;
        const businessType = apiKeyResponse.data.business_type;
        const { organisation_id: organisationId } = organisation;
        const { tenant_id: tenantIdentifier, product_id: productCode } = request;
        response.data = { is_bot_set: false, are_product_parameter: false, is_product_set: false };

        let tenant: TenantResponse;
        if (tenantIdentifier) {
            tenant = ResponseViewModel.getData(await this.tenantService.getByIdentifier(tenantIdentifier), null);
            if (!tenant) {
                return ResponseViewModel.withErrorModels([new ErrorModel('Invalid tenant-id', 'tenant_id')]);
            }
        }
        const tenantId = tenant ? tenant.id : null;

        // get bot & check bot for specific business type
        const bot = ResponseViewModel.getData(
            await this.botService.getOrganisationBot(organisationId, businessType, tenantId),
            null,
        );

        if (!!bot) {
            response.data.is_bot_set = true;
        }
        // get product
        const product = ResponseViewModel.getData(
            await this.productService.getByproductCode(productCode, organisationId, tenantId),
            null,
        );

        if (!product) {
            return response;
        }
        response.data.is_product_set = true;

        // get product parameter
        const parameter = ResponseViewModel.getData(
            await this.productParameterService.getProductParameters(organisationId, product.id),
            null,
        );

        if (!parameter) {
            return response;
        }
        response.data.are_product_parameter = true;

        return response;
    }
}
