export type MailQueueMessageType = {
    subject: string;
    content: string;
    snippet_content?: string;
    procurement_url?: string;
    supplier_url?: string;
};
