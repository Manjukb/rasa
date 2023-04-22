import { Customer, Product, Rfq } from '../database/models';

export type ChannelStatus = {
    channel_id: string;
    status: string;
    products: Product[];
    customer: Customer;
    default: boolean;
    updated_date: Date;
    // eslint-disable-next-line @typescript-eslint/ban-types
    nego: object;
    // eslint-disable-next-line @typescript-eslint/ban-types
    rfq: Rfq;
    rfq_number?: string;
    // eslint-disable-next-line @typescript-eslint/ban-types
    session?: object;
    client_messages?: Record<string, string>;
};

export type ChannelStatusResponse = {
    channel_status: ChannelStatus[];
    totalItems?: number;
};

export type RfqStatus = {
    rfq_id: string;
    status: string;
    // eslint-disable-next-line @typescript-eslint/ban-types
    session?: object;
    data?: string;
};
