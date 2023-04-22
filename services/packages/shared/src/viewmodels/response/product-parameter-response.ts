import { BotResponse } from './bot-response';
import { BuyerParameters } from '../../types/parameter';
import { ParameterConfiguration } from '../../types/parameter-configuration';

export class ProductParameterResponse {
    public id: string;
    public organisation_id: string;
    public product_id: string;
    public product_code: string;
    public product_name?: string;
    public parameter: ParameterConfiguration[];
    public created_date: Date;
    public updated_date: Date;
    public uom: string;
    public currency: string;
    public price: number;
    public saving_parameters: BuyerParameters;
    public category_id: string;
    public sub_category_id: string;
    public is_manual_nego: boolean;
    public quantity: number;
    public bot: BotResponse;
    public category_name: string;
    public step_count: BuyerParameters;
}
