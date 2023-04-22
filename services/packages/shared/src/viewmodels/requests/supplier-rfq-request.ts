import { ProcurementParameters } from '../../types/parameter';

import { RfqResponseItem } from '../response/rfq-response';

export class SupplierRfqRequest {
    public id: string;
    public items: RfqResponseItem[];
    // public items: { id: string; product_id: string; name: string; baseline_quantity: number; baseline_price: number }[];
    // public parameters: { name: string; label: string; value: number }[];
    public parameters: ProcurementParameters[];
}
