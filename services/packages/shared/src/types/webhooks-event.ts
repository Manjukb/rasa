export type BaseWebhooksEvent = {
    productCode: string;
    customerId: string;
    organisationId: string;
    tenantId: string;
};

export type NegotiationRequest = {
    rfqId: string;
    payload: never;
    user: never;
    exitNegotiation: boolean;
    accept: boolean;
};

export type WebhooksEventWithOffer = BaseWebhooksEvent & {
    offer: { [key: string]: string | number };
};

export type WebhooksEventWithTenantUser = BaseWebhooksEvent & {
    tenantUserId: string;
};
export type WebhooksEvent = WebhooksEventWithTenantUser & WebhooksEventWithOffer;
