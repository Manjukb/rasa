import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { ProductDescription, ProductInfo } from '../../types';

import { Category } from './category';
import { Organisation } from './organisation';
import { ProductParameter } from './product-parameter';
import { Tenant } from './tenant';

@Entity('product')
export class Product {
    @PrimaryColumn()
    public id: string;

    @Column()
    public organisation_id: string;

    @ManyToOne(() => Organisation, (organisation) => organisation.organisation_id)
    @JoinColumn({ name: 'organisation_id', referencedColumnName: 'organisation_id' })
    public organisation: Organisation;

    @Column()
    public product_code: string | null;

    @Column({ type: 'simple-json' })
    public product_info: ProductInfo;

    @CreateDateColumn({ name: 'created_date', type: 'timestamp without time zone' })
    public created_date: Date;

    @UpdateDateColumn({ name: 'updated_date', type: 'timestamp without time zone' })
    public updated_date: Date;

    @Column()
    public tenant_id: string | null;

    @ManyToOne(() => Tenant, (tenant) => tenant.id)
    @JoinColumn({ name: 'tenant_id', referencedColumnName: 'id' })
    public tenant: Tenant;

    @Column()
    public has_payment_terms: boolean;

    @Column()
    public is_manual_nego: boolean;

    @Column()
    public name: string | null;

    @Column()
    public category_id: string | null;

    @Column()
    public sub_category_id: string | null;

    @Column({ type: 'simple-json' })
    public description: ProductDescription | null;

    @ManyToOne(() => Category, (category) => category.id)
    @JoinColumn({ name: 'category_id', referencedColumnName: 'id' })
    public category: Category;

    @ManyToOne(() => Category, (category) => category.id)
    @JoinColumn({ name: 'sub_category_id', referencedColumnName: 'id' })
    public sub_category: Category;

    @Column()
    public is_active: boolean;

    @Column()
    public uom: string;

    @Column()
    public price: number;

    @Column()
    public quantity: number;

    @Column()
    public currency: string;

    public parameter: ProductParameter;
}
