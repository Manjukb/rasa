import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn, UpdateDateColumn } from 'typeorm';

import { SupplierCompany } from '.';

@Entity('supplier')
export class Supplier {
    @PrimaryColumn()
    public id: string;

    @Column()
    public name: string;

    @Column()
    public address: string;

    @Column()
    public supplier_company_id: string;

    @Column()
    public is_active: boolean;

    @CreateDateColumn({ name: 'created_date', type: 'timestamp without time zone' })
    public created_date: Date;

    @UpdateDateColumn({ name: 'updated_date', type: 'timestamp without time zone' })
    public updated_date: Date;

    @ManyToOne(() => SupplierCompany, (supplier_company) => supplier_company.id, {
        nullable: true,
    })
    @JoinColumn({ name: 'supplier_company_id', referencedColumnName: 'id' })
    public supplier_company: SupplierCompany;
}
