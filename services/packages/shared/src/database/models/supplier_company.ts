import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('supplier_company')
export class SupplierCompany {
    @PrimaryColumn()
    public id: string;

    @Column()
    public name: string;

    @Column()
    public address: string;

    @Column()
    public is_active: boolean;

    @CreateDateColumn({ name: 'created_date', type: 'timestamp without time zone' })
    public created_date: Date;

    @UpdateDateColumn({ name: 'updated_date', type: 'timestamp without time zone' })
    public updated_date: Date;
}
