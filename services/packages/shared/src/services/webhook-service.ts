/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { inject, injectable } from 'inversify';
import { Setting, TenantUser } from '../database/models';
import { BusinessType } from '../enum';
import { Constant } from '../helpers';
import { WebhooksEvent } from '../types';
import { BaseWebhooksEvent, WebhooksEventWithOffer } from '../types/webhooks-event';
import { RequestUserResponse } from '../viewmodels/response';
import { ErrorModel, ResponseViewModel } from '../viewmodels/response-viewmodel';
import { CustomerServiceContract } from './customer-service';
import { OrganisationServiceContract } from './organisation-service';
import { SettingServiceContract } from './setting-service';
import { TenantUserServiceContract } from './tenant-user-service';
import fetch from 'node-fetch';

export interface WebhookServiceContract {
    onOfferAccepted(data: Record<string, unknown>): void;
    onOfferRejected(data: Record<string, unknown>): void;
    onCustomerAcceptedOffer(data: Record<string, unknown>): void;
    onCustomerRejectedOffer(data: Record<string, unknown>): void;
    onCustomerStartedEnquiry(data: Record<string, unknown>): void;
    onAgentMadeOffer(data: Record<string, unknown>): void;
    // onOfferAcceptedByCustomer(data: Record<string, unknown>): void;
}
@injectable()
export class WebhookService {
    constructor(
        @inject('SettingService') private readonly settingService: SettingServiceContract,
        @inject('OrganisationService') private readonly organisationService: OrganisationServiceContract,
        @inject('TenantUserService') private readonly tenantUserService: TenantUserServiceContract,
        @inject('CustomerService') private readonly customerService: CustomerServiceContract,
    ) {}

    private async getCustomerAndTenantUser(
        customerId: string,
        tenantUserId: string,
    ): Promise<ResponseViewModel<{ customer: RequestUserResponse; tenantUser: RequestUserResponse }>> {
        const tenantUser = ResponseViewModel.getData(await this.tenantUserService.getUser(tenantUserId), null);
        const customer = ResponseViewModel.getData(await this.customerService.getUser(customerId), null);
        if (!tenantUser || !customer) {
            return ResponseViewModel.withErrorModels([
                new ErrorModel(
                    'either supplier user or customer not exists',
                    `tenantUser:${tenantUserId}, customer: ${customerId}`,
                ),
            ]);
        }

        return ResponseViewModel.with({ customer, tenantUser });
    }

    private async getCustomerAndTenantUserByTenantId(
        customerId: string,
        tenantId: string,
    ): Promise<ResponseViewModel<{ customer: RequestUserResponse; tenantUser: TenantUser }>> {
        const tenantUser = ResponseViewModel.getData(await this.tenantUserService.getAdminByTenantId(tenantId), null);
        const customer = ResponseViewModel.getData(await this.customerService.getUser(customerId), null);
        if (!tenantUser || !customer) {
            return ResponseViewModel.withErrorModels([
                new ErrorModel(
                    'either supplier user or customer not exists',
                    `tenantUser:${tenantId}, customer: ${customerId}`,
                ),
            ]);
        }

        return ResponseViewModel.with({ customer, tenantUser });
    }

    public async onOfferAccepted(webhooksEvent: WebhooksEvent): Promise<void> {
        const { offer, customerId, organisationId, tenantUserId, productCode } = webhooksEvent;
        const response = await this.getCustomerAndTenantUser(customerId, tenantUserId);
        if (ResponseViewModel.hasErrors(response)) {
            console.warn(response);
        }
        const { customer, tenantUser } = ResponseViewModel.getData(response, {
            customer: null,
            tenantUser: null,
        });

        if (!tenantUser || !customer) {
            console.warn(
                'either supplier user or customer not exists',
                `tenantUser:${tenantUserId}, customer: ${customerId}`,
            );
            return;
        }

        const data = {
            tenantId: tenantUser.email, // email will get the value of identifier
            organisationId,
            productCode,
            customerId: customer.email, //email is having the identifer value
            createdDate: new Date().toISOString(),
            ...offer,
        };

        const org = await this.organisationService.getLightWeight(organisationId);
        const { api_key: apiKey } = org.data.apiKeys.find((key) => key.business_type === BusinessType.sales);

        const eventData = {
            event: Constant.EzySourceNegotiationEvents.negotiationAccepted,
            data,
        };

        const settings = await this.settingService.getById(organisationId);
        if (!settings || !settings.settings) {
            console.warn('no webhook found for organisation', organisationId);
            return;
        }

        await this.sendHttpRequest(settings, eventData, apiKey);
    }

    public async onAgentMadeOffer(webhooksEvent: WebhooksEvent): Promise<void> {
        const { offer, customerId, organisationId, tenantUserId, productCode } = webhooksEvent;
        const response = await this.getCustomerAndTenantUser(customerId, tenantUserId);
        if (ResponseViewModel.hasErrors(response)) {
            console.warn(response);
        }
        const { customer, tenantUser } = ResponseViewModel.getData(response, {
            customer: null,
            tenantUser: null,
        });

        if (!tenantUser || !customer) {
            console.warn(
                'either supplier user or customer not exists',
                `tenantUser:${tenantUserId}, customer: ${customerId}`,
            );
            return;
        }

        const data = {
            tenantId: tenantUser.email, // email will get the value of identifier
            organisationId,
            productCode,
            customerId: customer.email, //email is having the identifer value
            createdDate: new Date().toISOString(),
            ...offer,
        };

        const org = await this.organisationService.getLightWeight(organisationId);
        const { api_key: apiKey } = org.data.apiKeys.find((key) => key.business_type === BusinessType.sales);

        const eventData = {
            event: Constant.EzySourceNegotiationEvents.negotiationAgentMadeOffer,
            data,
        };

        const settings = await this.settingService.getById(organisationId);
        if (!settings || !settings.settings) {
            console.warn('no webhook found for organisation', organisationId);
            return;
        }

        await this.sendHttpRequest(settings, eventData, apiKey);
    }

    public async onOfferRejected(webhooksEvent: WebhooksEvent): Promise<void> {
        const { offer, customerId, organisationId, tenantUserId, productCode } = webhooksEvent;
        const response = await this.getCustomerAndTenantUser(customerId, tenantUserId);
        if (ResponseViewModel.hasErrors(response)) {
            console.warn(response);
        }
        const { customer, tenantUser } = ResponseViewModel.getData(response, {
            customer: null,
            tenantUser: null,
        });

        if (!tenantUser || !customer) {
            console.warn(
                'either supplier user or customer not exists',
                `tenantUser:${tenantUserId}, customer: ${customerId}`,
            );
            return;
        }

        const data = {
            tenantId: tenantUser.email, // email will get the value of identifier
            organisationId,
            productCode,
            customerId: customer.email, //email is having the identifer value
            createdDate: new Date().toISOString(),
            ...offer,
        };

        const org = await this.organisationService.getLightWeight(organisationId);
        const { api_key: apiKey } = org.data.apiKeys.find((key) => key.business_type === BusinessType.sales);

        const eventData = {
            event: Constant.EzySourceNegotiationEvents.negotiationRejected,
            data,
        };

        const settings = await this.settingService.getById(organisationId);
        if (!settings || !settings.settings) {
            console.warn('no webhook found for organisation', organisationId);
            return;
        }

        await this.sendHttpRequest(settings, eventData, apiKey);
    }

    public async onCustomerAcceptedOffer(webhooksEvent: WebhooksEventWithOffer): Promise<void> {
        const { offer, customerId, organisationId, productCode, tenantId } = webhooksEvent;
        const response = await this.getCustomerAndTenantUserByTenantId(customerId, tenantId);

        if (ResponseViewModel.hasErrors(response)) {
            console.warn(response);
        }

        const { customer, tenantUser } = ResponseViewModel.getData(response, {
            customer: null,
            tenantUser: null,
        });

        if (!tenantUser || !customer) {
            console.warn(
                'either supplier user or customer not exists',
                `tenantUser:${tenantId}, customer: ${customerId}`,
            );
            return;
        }

        const data = {
            tenantId: tenantUser.identifier, // email will get the value of identifier
            organisationId,
            productCode,
            customerId: customer.email, //email is having the identifer value
            createdDate: new Date().toISOString(),
            ...offer,
        };

        const org = await this.organisationService.getLightWeight(organisationId);
        const { api_key: apiKey } = org.data.apiKeys.find((key) => key.business_type === BusinessType.sales);

        const eventData = {
            event: Constant.EzySourceNegotiationEvents.negotiationCustomerAcceptedOffer,
            data,
        };
        const settings = await this.settingService.getById(organisationId);
        if (!settings || !settings.settings) {
            console.warn('no webhook found for organisation', organisationId);
            return;
        }

        await this.sendHttpRequest(settings, eventData, apiKey);
    }

    public async onCustomerRejectedOffer(webhooksEvent: WebhooksEventWithOffer): Promise<void> {
        const { offer, customerId, organisationId, productCode, tenantId } = webhooksEvent;
        const response = await this.getCustomerAndTenantUserByTenantId(customerId, tenantId);

        if (ResponseViewModel.hasErrors(response)) {
            console.warn(response);
        }

        const { customer, tenantUser } = ResponseViewModel.getData(response, {
            customer: null,
            tenantUser: null,
        });

        if (!tenantUser || !customer) {
            console.warn(
                'either supplier user or customer not exists',
                `tenantUser:${tenantId}, customer: ${customerId}`,
            );
            return;
        }

        const data = {
            tenantId: tenantUser.identifier, // email will get the value of identifier
            organisationId,
            productCode,
            customerId: customer.email, //email is having the identifer value
            createdDate: new Date().toISOString(),
            ...offer,
        };

        const org = await this.organisationService.getLightWeight(organisationId);
        const { api_key: apiKey } = org.data.apiKeys.find((key) => key.business_type === BusinessType.sales);

        const eventData = {
            event: Constant.EzySourceNegotiationEvents.negotiationCustomerRejectedOffer,
            data,
        };
        const settings = await this.settingService.getById(organisationId);
        if (!settings || !settings.settings) {
            console.warn('no webhook found for organisation', organisationId);
            return;
        }

        await this.sendHttpRequest(settings, eventData, apiKey);
    }

    public async onCustomerStartedEnquiry(webhooksEvent: BaseWebhooksEvent): Promise<void> {
        const { customerId, organisationId, productCode, tenantId } = webhooksEvent;
        const response = await this.getCustomerAndTenantUserByTenantId(customerId, tenantId);

        if (ResponseViewModel.hasErrors(response)) {
            console.warn(response);
        }

        const { customer, tenantUser } = ResponseViewModel.getData(response, {
            customer: null,
            tenantUser: null,
        });

        if (!tenantUser || !customer) {
            console.warn(
                'either supplier user or customer not exists',
                `tenantUser:${tenantId}, customer: ${customerId}`,
            );
            return;
        }

        const data = {
            tenantId: tenantUser.identifier, // email will get the value of identifier
            organisationId,
            productCode,
            customerId: customer.email, //email is having the identifer value
            createdDate: new Date().toISOString(),
        };

        const org = await this.organisationService.getLightWeight(organisationId);
        const { api_key: apiKey } = org.data.apiKeys.find((key) => key.business_type === BusinessType.sales);

        const eventData = {
            event: Constant.EzySourceNegotiationEvents.negotiationCustomerStartedEnquiry,
            data,
        };
        const settings = await this.settingService.getById(organisationId);
        if (!settings || !settings.settings) {
            console.warn('no webhook found for organisation', organisationId);
            return;
        }
        await this.sendHttpRequest(settings, eventData, apiKey);
    }

    public async sendHttpRequest(settings: Setting, eventData: any, apiKey: string): Promise<void> {
        const rsp = await fetch(settings.settings.webhook as string, {
            body: JSON.stringify(eventData),
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
            },
        });

        if (!rsp.ok) {
            console.error('webhook call failed', rsp, eventData.data);
            return;
        }
        const response = await rsp.json();
        console.info(response, ' is the response');
    }
}
