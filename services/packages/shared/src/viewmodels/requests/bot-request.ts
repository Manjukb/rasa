import { Parameter } from '../../types/parameter';

export class BotRequest {
    public id: string;
    public parameter: Parameter;
    public organisation_id: string;
    public business_type: string;
    public category_ids?: string[];
    public updated_by?: string;
}
