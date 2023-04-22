import { MailQueue } from '../database/models';
import { MailQueueResponse } from '../viewmodels/response';

export class MailQueueResponseTransformer {
    public static transform(mailQueue: MailQueue, userId: string): MailQueueResponse {
        const mailQueueResponse = new MailQueueResponse();
        mailQueueResponse.id = mailQueue.id;
        mailQueueResponse.message = mailQueue.message;
        mailQueueResponse.created_by = mailQueue.created_by;
        mailQueueResponse.send_at = mailQueue.send_at;
        const userIds = mailQueue.user_ids.filter((e) => e.user_id === userId);
        mailQueueResponse.user_ids = Object.assign({}, ...userIds);
        return mailQueueResponse;
    }

    public static transformList(mailQueues: MailQueue[], userId: string): MailQueueResponse[] {
        return mailQueues.map((mailQueue) => this.transform(mailQueue, userId));
    }
}
