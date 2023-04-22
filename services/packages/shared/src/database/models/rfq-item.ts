import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn, UpdateDateColumn } from 'typeorm';

import { Product } from './product';
import { Rfq } from './rfq';
import { User } from './user';

@Entity('rfq_item')
export class RfqItem {
    @PrimaryColumn()
    public id: string;

    @Column()
    public rfq_id: string;

    @Column()
    public category_id: string;

    @Column()
    public product_id: string;

    @Column()
    public baseline_price: number;

    @Column()
    public baseline_quantity: number;

    @Column()
    public uom: string;

    @Column()
    public currency: string;

    @Column()
    public is_quantity_negotiable: boolean;

    @Column()
    public created_by: string;

    @Column()
    public updated_by: string;

    @CreateDateColumn({ name: 'created_date', type: 'timestamp without time zone' })
    public created_date: Date;

    @UpdateDateColumn({ name: 'updated_date', type: 'timestamp without time zone' })
    public updated_date: Date;

    @ManyToOne(() => User, (user) => user.user_id, { nullable: false })
    @JoinColumn({ name: 'created_by', referencedColumnName: 'user_id' })
    public creator: User;

    @ManyToOne(() => User, (user) => user.user_id, { nullable: false })
    @JoinColumn({ name: 'updated_by', referencedColumnName: 'user_id' })
    public updater: User;

    @ManyToOne(() => Rfq, (rfq) => rfq.id, { nullable: false })
    @JoinColumn({ name: 'rfq_id', referencedColumnName: 'id' })
    public rfq: Rfq;

    @ManyToOne(() => Product, (product) => product.id, { nullable: false })
    @JoinColumn({ name: 'product_id', referencedColumnName: 'id' })
    public product: Product;
}
