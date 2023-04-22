import { CategoryResponse } from './category-response';
import { OrganisationLightWeightResponse } from './organisation-light-weight-response';
import { Parameter } from '../../types/parameter';

export class BotResponse {
    public id: string;
    public organisation_id: string;
    public tenant_id: string;
    public business_type?: string;
    public parameter: Parameter;
    public created_date: Date;
    public updated_date: Date;
    public updated_by?: string;
    public category_ids?: string[];
    public categories?: CategoryResponse[];

    public organisation: OrganisationLightWeightResponse;
}
