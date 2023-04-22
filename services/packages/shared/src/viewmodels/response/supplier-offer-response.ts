export class SupplierOfferResponse {
    public rfq_parameters: {
        name: string;
        value: number;
    }[];
    public rfq_items: {
        id: string;
        product_id: string;
        baseline_quantity: number;
        baseline_price: number;
        uom: string;
        currency: string;
        is_quantity_negotiable: boolean;
        name: string;
        category_id: string;
    }[];
}
