// import {
//     ProcurementParameterFieldWithBoolean,
//     ProcurementParameterFieldWithRange,
// } from '../viewmodels/response/bot-schema-response';

import { NegotiationSession } from './negotiation-session';
import { Rfq } from '../database/models';

export type ProcurementParameters = {
    util_score_formula?: string;
    name: string;
    label: string;
    weight?: number;
    value?: number | number[] | boolean;
    rawValue: number;
    is_inverse?: boolean;
    util_score?: number;
};

export type NegotiationResponse = {
    channel_id: string;
    rfq: Rfq;
    rfq_id: string;
    session: NegotiationSession;
    status: string;
};

export type SupplierParameters = {
    min_numbers_of_supplier: number;
    time_to_respond: {
        contract: number;
        spot: number;
    };
    time_to_award: {
        contract: number;
        spot: number;
    };
};

export type BuyerParameters = {
    price: number;
    quantity: number;
};

export type Parameter = {
    auto_accept_score?: number;
    saving_parameters?: BuyerParameters;
    step_count?: BuyerParameters;
    payment_term_pattern?: number[];
    counter_offers?: number;
    evaluation_method?: string;
    max_concession_score?: number;
    min_accept_score?: number;
    max_concession_round: number;
    concession_pattern: number[];
    business_type: string;
    procurement_parameters?: ProcurementParameters[];
    supplier_parameters: SupplierParameters;
    rfq_target_saving?: number;
    price?: Record<string, number>;
    quantity?: Record<string, number>;
    floor_value_saving_target?: number;
    bot_counter_offer_delay?: number;
    client_messages?: Record<string, string>;
    price_quantity_default?: BuyerParameters;
};
