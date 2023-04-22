import { Negotiation, Organisation } from '../../database/models';
import { Offer, Parameter } from '../../types';

import { BuyerParameters } from '../../types/parameter';
import { ParameterConfiguration } from '../../types/parameter-configuration';
import { Util } from '../..';

export class NegotiationSessionResponse {
    public id: string;
    public organisation_id: string;
    public price_quantity_default?: BuyerParameters;
    public tenant_id?: string;
    public customer_name: string;
    public customer_identifier: string;
    public product_name: string;
    public product_code: string;
    public is_bot_active: boolean;
    public has_unread_messages: boolean;
    public rfq_number?: number | string;
    public round: number;
    public product_parameters?: ParameterConfiguration[];
    public offers: Offer[];
    public status: string;
    public created_date: Date;
    public updated_date: Date;
    public bot_parameter: Parameter;

    public static fromModel(negotiation: Negotiation, organisation: Organisation): NegotiationSessionResponse {
        const {
            id,
            round,
            status,
            is_bot_active,
            created_date,
            updated_date,
            product_code,
            customer,
            rfq,
            session,
            has_unread_messages,
        } = negotiation;
        const moq = Number(session.product_parameters.find((p) => p.name === 'quantity').min);
        session &&
            (session.offers || []).forEach((o) => {
                o.rfq_offer.rfq_items.forEach((r) => {
                    r.max_baseline_quantity =
                        moq + Number(moq * session.bot_parameter.saving_parameters.quantity) / 100 || null;
                });
                o.price_utility_score = Util.round(o.price_utility_score * 100, 2);
                o.utility_score = Util.round((o.utility_score as number) * 100, 2);
            });
        return {
            id,
            organisation_id: customer.organisation_id,
            price_quantity_default: organisation.organisation_settings?.price_quantity_default,
            tenant_id: session.product ? session.product.tenant_id : null,
            customer_name: customer.name,
            customer_identifier: customer.identifier,
            product_name: session.product ? session.product.productInfo.name : null,
            product_code,
            rfq_number: rfq.rfq_number ? this.getORDNumber(rfq.rfq_number) : null,
            is_bot_active,
            bot_parameter: session.bot_parameter,
            has_unread_messages,
            round,
            product_parameters: session.product_parameters || null,
            offers: session.offers,
            status,
            created_date,
            updated_date,
        };
    }

    public static fromModels(negotiations: Negotiation[], organisation: Organisation): NegotiationSessionResponse[] {
        return negotiations.map((negotiation) => NegotiationSessionResponse.fromModel(negotiation, organisation));
    }

    public static getORDNumber(rfqNumber: number): string {
        const text = 'ORD';
        const paddedRfqNumber = Util.padDigits(rfqNumber, 10);

        return `${text}${paddedRfqNumber}`;
    }
}
