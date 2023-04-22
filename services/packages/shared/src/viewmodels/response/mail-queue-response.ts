import { MailCreatedByInfo, MailQueueMessageType, MetaInfoMessageType, ReadUnreadUserIds } from '../..';

export class MailQueueResponse {
    public id: string;
    public rfq_id: string;
    public message: MailQueueMessageType;
    public meta_info: MetaInfoMessageType;
    public type: string;
    public last_sent_time: Date;
    public send_at?: Date;
    public created_date: Date;
    public created_by: MailCreatedByInfo;
    public user_ids: ReadUnreadUserIds[];
}
