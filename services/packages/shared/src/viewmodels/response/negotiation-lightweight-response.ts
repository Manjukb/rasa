import { Negotiation } from '../../database/models';

export class NegotiationLightWeightResponse {
    public id: string;
    public channel_id: string;
    public round: number;
    public status: string;
    public is_bot_active: boolean;
    public has_unread_messages: boolean;

    public created_date: Date;
    public updated_date: Date;

    public static fromModel(negotiation: Negotiation): NegotiationLightWeightResponse {
        const {
            id,
            channel_id,
            round,
            status,
            is_bot_active,
            has_unread_messages,
            created_date,
            updated_date,
        } = negotiation;
        return {
            id,
            channel_id,
            round,
            status,
            is_bot_active,
            has_unread_messages,
            created_date,
            updated_date,
        };
    }

    public static fromModels(negotiations: Negotiation[]): NegotiationLightWeightResponse[] {
        return negotiations.map((negotiation) => NegotiationLightWeightResponse.fromModel(negotiation));
    }
}
