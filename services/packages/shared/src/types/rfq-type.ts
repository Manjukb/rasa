export type RfqItemType = {
    product_id: string;
    category_id: string;
    baseline_price: number;
    baseline_quantity: number;
    uom: string;
    currency: string;
    is_quantity_negotiable: boolean;
};

export type RfqSupplierType = {
    id: string;
    suppliers: {
        id: string;
    }[];
    // user_id: string;
    send_mail: boolean;
};

export type RfqNegoProcess = {
    launch_date: Date;
    inform_all_bde_at_same_time: boolean;
    deadlines: string[];
    purchase_type?: string;
};
