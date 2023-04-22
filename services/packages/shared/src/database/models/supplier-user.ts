import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn, UpdateDateColumn } from 'typeorm';

import { Supplier } from './supplier';
import { User } from './user';

@Entity('supplier_user')
export class SupplierUser {
    @PrimaryColumn()
    public id: string;

    @Column()
    public supplier_id: string;

    @Column()
    public user_id: string;

    @CreateDateColumn({ name: 'created_date', type: 'timestamp without time zone' })
    public created_date: Date;

    @UpdateDateColumn({ name: 'updated_date', type: 'timestamp without time zone' })
    public updated_date: Date;

    @ManyToOne(() => Supplier, (supplier) => supplier.id, { nullable: false })
    @JoinColumn({ name: 'supplier_id', referencedColumnName: 'id' })
    public supplier: Supplier;

    @ManyToOne(() => User, (user) => user.user_id, { nullable: false })
    @JoinColumn({ name: 'user_id', referencedColumnName: 'user_id' })
    public user: User;
}
