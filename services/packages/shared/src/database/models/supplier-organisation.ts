import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToOne,
    PrimaryColumn,
    UpdateDateColumn,
} from 'typeorm';

import { Organisation } from './organisation';
import { Supplier } from './supplier';
import { SupplierCategoryProduct } from './supplier-category-product';

@Entity('supplier_organisation')
export class SupplierOrganisation {
    @PrimaryColumn()
    public id: string;

    @Column()
    public supplier_id: string;

    @Column()
    public organisation_id: string;

    @CreateDateColumn({ name: 'created_date', type: 'timestamp without time zone' })
    public created_date: Date;

    @UpdateDateColumn({ name: 'updated_date', type: 'timestamp without time zone' })
    public updated_date: Date;

    @ManyToOne(() => Supplier, (supplier) => supplier.id, { nullable: false })
    @JoinColumn({ name: 'supplier_id', referencedColumnName: 'id' })
    public supplier: Supplier;

    @ManyToOne(() => Organisation, (organisation) => organisation.organisation_id, { nullable: false })
    @JoinColumn({ name: 'organisation_id', referencedColumnName: 'organisation_id' })
    public organisation: Organisation;

    @OneToOne(() => SupplierCategoryProduct, (supplier_category_product) => supplier_category_product.supplier_id, {
        nullable: true,
    })
    @JoinColumn({ name: 'supplier_id', referencedColumnName: 'supplier_id' })
    public supplier_category_product: SupplierCategoryProduct;
}
