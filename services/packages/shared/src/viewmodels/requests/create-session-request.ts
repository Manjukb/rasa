import { ProcurementParameters } from '../../types/parameter';
import { RfqResponseItem } from '../response/rfq-response';

export class CreateSessionRequest {
    public product_id?: string;
    public product_name?: string;
    public history?: boolean;
    public buyer_id?: string;
    public page?: string;
    public product_supplier_id?: string;
    public supplier_id?: string;
    public rfqId?: string;
    public payload?: {
        rfq_items: RfqResponseItem[];
        rfq_parameters: ProcurementParameters[];
    };
    exitNegotiation?: boolean;
    accept?: boolean;
}
