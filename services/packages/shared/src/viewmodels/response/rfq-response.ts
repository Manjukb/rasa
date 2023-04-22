import { Parameter } from '../../types/parameter';
import { RfqNegoProcess } from '../..';

export class RfqResponseItem {
    id: string;
    product_id: string;
    name: string;
    baseline_price: number;
    catalog_price: number;
    baseline_quantity: number;
    max_baseline_quantity?: number;
    uom: string;
    currency: string;
    is_quantity_negotiable: boolean;
    util_score?: number;
    quantity_util_score?: number;
    util_score_formula?: string;
}

export class RfqResponse {
    public id: string;
    public organisation_id: string;
    public winner_supplier_id?: string;
    public status: string;
    public launch_date?: string;
    public rfq_number: string;
    public created_date: Date;
    public updated_date: Date;
    public updated_by: string;
    public parameter: Parameter;
    public negotiation_process: RfqNegoProcess;
    public categories: {
        id: string;
        name: string;
    }[];
    public items: RfqResponseItem[];

    public suppliers: {
        id: string;
        name: string;
        address: string;
        supplier: {
            name: string;
            email: string;
        };
    }[];
}
