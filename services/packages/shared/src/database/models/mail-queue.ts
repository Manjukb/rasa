import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { MailCreatedByInfo, MailQueueMessageType, MetaInfoMessageType, ReadUnreadUserIds } from '../..';

import { Rfq } from './rfq';

@Entity('mail_queue')
export class MailQueue {
    @PrimaryColumn()
    public id: string;

    @Column()
    public rfq_id: string;

    @Column({ type: 'simple-json' })
    public message: MailQueueMessageType;

    @Column({ type: 'simple-json' })
    public meta_info: MetaInfoMessageType;

    @Column()
    public type: string;

    @Column({ type: 'simple-json' })
    public created_by: MailCreatedByInfo;

    @Column()
    public last_sent_time: Date;

    @Column({ name: 'send_at', type: 'timestamp with time zone' })
    public send_at?: Date;

    @CreateDateColumn({ name: 'created_date', type: 'timestamp without time zone' })
    public created_date: Date;

    @ManyToOne(() => Rfq, (rfq) => rfq.id, { nullable: false })
    @JoinColumn({ name: 'rfq_id', referencedColumnName: 'id' })
    public rfq: Rfq;

    @Column({ type: 'jsonb' })
    public user_ids: ReadUnreadUserIds[];
}
