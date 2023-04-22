import { CommentResponse, ProductResponse } from '../viewmodels/response';
import { Parameter, ProcurementParameters } from './parameter';

import { ParameterConfiguration } from './parameter-configuration';
import { RfqResponseItem } from '../viewmodels/response/rfq-response';

class Offer {
    public by: string;
    public offer?: {
        [key: string]: string;
    };
    public offer_score?: {
        [key: string]: string;
    };
    public utility_score: string | number;
    public round: number;
    public user_Id?: string;
    public total?: number;
    public supplier_id?: string;
    public supplier_name?: string;
    public rfq_offer?: {
        rfq_items: RfqResponseItem[];
        rfq_parameters: ProcurementParameters[];
    };
    public comment?: CommentResponse[];
    public price_utility_score?: number;
    public at?: Date;
    public message: string;
    public formula?: string;
    public minFormula?: string;
    public formulatorOffer?: string;
}
export type RfqBaselineOffer = {
    by?: string;
    supplier_id?: string;
    rfq_items: RfqResponseItem[];
    rfq_parameters: ProcurementParameters[];
};

class NegotiationSession {
    public bot_parameter: Parameter;
    public product_parameters: ParameterConfiguration[];
    public offers: Offer[];
    public rfq_history: History[];
    public product?: ProductResponse;
    public rfq_items?: RfqResponseItem[];
    public initial_offers?: RfqBaselineOffer[];
    public baseline_offers?: RfqBaselineOffer;
}

class NegotiationCalculateResponse {
    customer: Offer;
    bot: Offer;
}

class History {
    public by: string;
    public reason?: string;
    public action?: string;
    public round?: number;
    public at?: Date;
    public name?: string;
}
export { NegotiationSession, Offer, NegotiationCalculateResponse, History };
