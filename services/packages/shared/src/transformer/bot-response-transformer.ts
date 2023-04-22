import { Bot, Category } from '../database/models';

import { BotResponse } from '../viewmodels/response';
import { OrganisationLightWeightResponseTransformer } from './organisation-light-weight-response-transformer';

export class BotResponseTransformer {
    public static transform(bot: Bot, categories: Category[]): BotResponse {
        const botResponse = new BotResponse();
        botResponse.id = bot.id.toString();
        botResponse.created_date = bot.created_date;
        botResponse.updated_date = bot.updated_date;
        botResponse.business_type = bot.business_type;
        botResponse.parameter = bot.negotiation_metric;
        botResponse.organisation_id = bot.organisation_id;
        botResponse.tenant_id = bot.tenant_id;
        botResponse.updated_by = bot.updated_by;

        delete botResponse.parameter.business_type;
        if (bot.organisation) {
            botResponse.organisation = OrganisationLightWeightResponseTransformer.transform(bot.organisation);
        }
        const { negotiation_metric: metric } = bot;
        botResponse.parameter = {
            auto_accept_score: metric.auto_accept_score ?? 1,
            // payment_term_pattern?: nu
            counter_offers: metric.counter_offers ?? 1,
            evaluation_method: metric.evaluation_method ?? 'utility',
            max_concession_score: metric.max_concession_score ?? 1,
            min_accept_score: metric.min_accept_score ?? 1,
            max_concession_round: metric.max_concession_round,
            concession_pattern: metric.concession_pattern,
            business_type: bot.business_type,
            price: metric.price ?? null,
            quantity: metric.quantity ?? null,
            rfq_target_saving: metric.rfq_target_saving,
            procurement_parameters: metric.procurement_parameters ?? null,
            saving_parameters: metric.saving_parameters ?? null,
            supplier_parameters: metric.supplier_parameters ?? null,
        };
        botResponse.categories = [];
        if (bot.category_ids && bot.category_ids.length > 0) {
            //TODO: convert to categoryresponse[]
            botResponse.categories = bot.category_ids.map((id) => categories.find((c) => c.id === id));
        }

        return botResponse;
    }

    public static transformList(bots: Bot[], categories: Category[]): BotResponse[] {
        const response = bots.map(
            (bot: Bot): BotResponse => {
                const botResponse = this.transform(bot, categories);

                return botResponse;
            },
        );

        return response;
    }
}
