import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn, UpdateDateColumn } from 'typeorm';

import { Customer } from './customer';
import { NegotiationSession } from '../../types';
import { Product } from './product';
import { Rfq } from './rfq';

@Entity('negotiation')
export class Negotiation {
    @PrimaryColumn({ name: 'id' })
    public id: string;

    @Column()
    public customer_id: string;

    @ManyToOne(() => Customer, (customer) => customer.id)
    @JoinColumn({ name: 'customer_id', referencedColumnName: 'id' })
    public customer: Customer;

    @Column()
    public product_id: string;

    @ManyToOne(() => Product, (product) => product.id)
    @JoinColumn({ name: 'product_id', referencedColumnName: 'id' })
    public product: Product;

    @Column()
    public channel_id: string;

    @Column()
    public round: number;

    @Column()
    public is_bot_active: boolean;

    @Column({ type: 'simple-json' })
    public session: NegotiationSession;

    @Column()
    public status: string;

    @CreateDateColumn({ name: 'created_date', type: 'timestamp without time zone' })
    public created_date: Date;

    @UpdateDateColumn({ name: 'updated_date', type: 'timestamp without time zone' })
    public updated_date: Date;

    @Column()
    public product_code: string;

    @Column({ type: 'simple-json' })
    public last_message: any;

    @Column()
    public has_unread_messages: boolean;

    @Column()
    public rfq_id: string;

    @ManyToOne(() => Rfq, (rfq) => rfq.id)
    @JoinColumn({ name: 'rfq_id', referencedColumnName: 'id' })
    public rfq: Rfq;

    @Column({ type: 'simple-json' })
    public valid_supplier_ids: string[];
}
