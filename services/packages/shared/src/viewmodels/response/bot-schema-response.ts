class field {
    type: string;
    required: boolean;
}

class numberFiled extends field {
    min: number;
    max: number;
    default?: number;
}

class arrayNumberFiled extends field {
    items: numberFiled;
    values?: number[];
}

class enumFiled extends field {
    enum: string[];
}

type ProcurementRangeType = {
    unit?: string;
    type: string;
    label: string;
    min: number;
    max: number;
    step?: number;
    disabled: boolean;
};

export class ProcurementParameterFieldWithRange {
    name: string;
    label: string;
    is_inverse: boolean;
    parameters: {
        weight: ProcurementRangeType;
        value: ProcurementRangeType;
    };
}
export class ProcurementParameterFieldWithBoolean {
    name: string;
    label: string;
    is_inverse: boolean;
    type?: string;
    parameters: {
        weight: ProcurementRangeType;
    };
}

export class BotSchemaResponse {
    max_concession_round: numberFiled;
    max_concession_score: numberFiled;
    min_accept_score: numberFiled;
    auto_accept_score: numberFiled;
    concession_pattern: arrayNumberFiled;
    negotiation_round: numberFiled;
    counter_offers: numberFiled;
    business_type: enumFiled;

    procurement_parameters?: Array<ProcurementParameterFieldWithRange | ProcurementParameterFieldWithBoolean>;
}

export class BotMessagesSchemaResponse {
    first: Array<string>;
    mid: Array<string>;
    last: Array<string>;
}
