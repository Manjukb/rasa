import { MailQueueMessageType, Parameter, RfqItemType, RfqNegoProcess, RfqSupplierType } from '../../types';
import { Rfq, RfqItem, RfqSupplier, Util } from '../..';

import { ICreatedBy } from '../../interfaces';

export class RfqRequest implements ICreatedBy {
    public id?: string;
    public organisation_id: string;
    public status: string;

    public launch_date?: string;
    public negotiation_process: RfqNegoProcess | null;
    public parameter: Parameter | null;

    public items: RfqItemType[];
    public suppliers: RfqSupplierType[];
    public created_by: string;
    public updated_by: string;
    public message?: MailQueueMessageType;
    public buyerId: string;
    public supplierId: string;

    public static toRFQModel(request: RfqRequest, userId: string, organisationId: string): Rfq {
        const { status, negotiation_process, parameter, id } = request;
        const rfq = new Rfq();
        rfq.id = id;
        if (!id) {
            rfq.id = Util.guid();
            rfq.created_by = userId;
            rfq.buyer_id = parseInt(request.buyerId, 10) || 0;
            rfq.supplier_id = parseInt(request.supplierId, 10) || 0;
        }
        status && (rfq.status = status);
        rfq.organisation_id = organisationId;
        negotiation_process && (rfq.negotiation_process = negotiation_process);
        parameter && (rfq.parameter = parameter);
        rfq.updated_by = userId;
        rfq.product_ids = request.items.map((item) => item.product_id);
        request.items && request.items.length && (rfq.category_ids = [request.items[0].category_id]);
        request.negotiation_process && (rfq.launch_date = request.negotiation_process.launch_date);

        return rfq;
    }

    public static toRfqItemModel(item: RfqItemType, rfqId: string, userId: string): RfqItem {
        const rfqItem = new RfqItem();
        rfqItem.id = Util.guid();
        rfqItem.rfq_id = rfqId;
        rfqItem.created_by = userId;
        rfqItem.updated_by = userId;
        rfqItem.product_id = item.product_id;
        rfqItem.category_id = item.category_id;
        rfqItem.baseline_price = item.baseline_price;
        rfqItem.baseline_quantity = item.baseline_quantity;
        rfqItem.uom = item.uom;
        rfqItem.currency = item.currency;
        rfqItem.is_quantity_negotiable = item.is_quantity_negotiable;

        return rfqItem;
    }

    public static toRfqSupplierModel(supplier: RfqSupplierType, rfqId: string, userId: string): RfqSupplier {
        const rfqSupplier = new RfqSupplier();
        rfqSupplier.id = Util.guid();
        rfqSupplier.supplier_id = supplier.id;
        rfqSupplier.user_id = userId;
        rfqSupplier.rfq_id = rfqId;
        rfqSupplier.send_mail = true;
        // rfqSupplier.send_mail = supplier.send_mail;

        return rfqSupplier;
    }
}
