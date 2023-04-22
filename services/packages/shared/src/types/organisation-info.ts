import { BuyerParameters } from './parameter';

export class OrganisationInfo {
    name: string;
    type?: string;
    status: string;
}

export class OrganisationSettings {
    step_count: { price: number; quantity: number };
    auto_accept_score: number;
    max_concession_score: number;
    floor_value_saving_target: number;
    bot_counter_offer_delay: number;
    client_messages?: Record<string, string>;
    price_quantity_default?: BuyerParameters;
}
