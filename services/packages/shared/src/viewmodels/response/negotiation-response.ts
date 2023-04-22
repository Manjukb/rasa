export class NegotiationActionResponse {
    public id: string;
    public type: string | null;
    public text: string;
    public block: null | boolean;
    public subtext: string;
}

class BotMessageResponse {
    public type: string;
    public text: string;
    // public description?: string;
    public sub_text?: string;
}

// export class NegotiationResponse {
//     public type: string;
//     public title: string;
//     public description: string;
//     public action: NegotiationActionResponse;
// }

export class OfferParameters {
    name: string;
    value: number | string;
    unit: string;
    display_name: string;
    quantity_unit: string;
}

export class OfferActionResponse extends BotMessageResponse {
    // public type: string;
    // public text: string;
    // public description: string;
    // public sub_text: string;
    public parameters?: OfferParameters[];
    public actions: NegotiationActionResponse[];
}
class MessageFormRequiredValidator {
    type: string;
    required: boolean;
    message: string;
}
class MessageFormRangeValidator {
    type: string;
    min: number;
    max: number;
}
class MessageFormStepValidator {
    type: string;
    step: number;
    from: number | string;
}
class MessageFormGreaterThanValidator {
    type: string;
    greaterThan: number;
}

export class OfferFormResponse extends BotMessageResponse {
    public product_name: string;
    public parameter: {
        id: string;
        type: string;
        label: string;
        display_name: string;
        step: string | number[];
        unit: string;
        quantity_unit: string;
        inputProps: {
            step: string | number[];
            initialValue: number | string;
            defaultValue: number | string;
        };
        validators: [
            MessageFormRequiredValidator,
            MessageFormGreaterThanValidator,
            MessageFormRangeValidator,
            MessageFormStepValidator,
        ];
    }[];

    public actions: NegotiationActionResponse[];
}

export class UnAcceptAbleOfferResponse extends BotMessageResponse {
    // public type: string;
    // public text: string;
    public product_name: string;
    public values: {
        [key: string]: string;
    };
    public values2: OfferParameters[];
}

export class SimpleOfferResponse extends BotMessageResponse {
    // type: string;
    // text: string;
    // description?: string;
    parameters?: OfferParameters[];
    actions?: NegotiationActionResponse[];
}

export class AffirmOfferParameters {
    parameters: OfferParameters[];
}
