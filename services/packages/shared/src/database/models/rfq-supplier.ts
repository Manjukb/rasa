import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn, UpdateDateColumn } from 'typeorm';

import { Rfq } from './rfq';

@Entity('rfq_supplier')
export class RfqSupplier {
    @PrimaryColumn()
    public id: string;

    @Column()
    public rfq_id: string;

    @Column({ nullable: true })
    public user_id: string;

    @Column()
    public supplier_id: string;

    @Column()
    public send_mail: boolean;

    @CreateDateColumn({ name: 'created_date', type: 'timestamp without time zone' })
    public created_date: Date;

    @UpdateDateColumn({ name: 'updated_date', type: 'timestamp without time zone' })
    public updated_date: Date;

    @ManyToOne(() => Rfq, (rfq) => rfq.id, { nullable: false })
    @JoinColumn({ name: 'rfq_id', referencedColumnName: 'id' })
    public rfq: Rfq;
}
