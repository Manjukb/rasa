export class NegotiationSessionResponse {
    public baseline: number;
    public customer_offer = 0;
    public customer_offer_score = 0;
    public inverse: boolean;
    public max: number;
    public min: number;
    public name: string;
    public negotiable: boolean;
    public step: number;
    public step_offer: boolean;
    public unit: string;
    public weight: number;
    public counter_offer = 0;
    public counter_offer_score = 0;
}

export type ParamterNegotiation = {
    [key: string]: NegotiationSessionResponse;
};

export class NegotiationSessionResponseType {
    public inputResult: ParamterNegotiation;
    public totalScore: number;
    public acceptOffer: boolean;
}
