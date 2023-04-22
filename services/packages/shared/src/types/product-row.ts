import { BuyerParameters } from './parameter';

export type param = {
    min: number;
    max: number;
    inverse: boolean;
    step: string;
    weight: number;
    baseline?: number;
    unit: string;
    name: string;
};

export type ProductRow = {
    id?: string;
    product_id?: string;
    code?: string;

    name: string;
    category: string;

    subcategory?: string;
    product_code?: string;
    description_1?: string;
    description_2?: string;

    uom?: string;
    price?: number;
    quantity?: number;
    currency?: string;
    saving_parameters: BuyerParameters;
    step_count: BuyerParameters;
    is_manual_nego: boolean;
    params: Record<string, param>;
};
