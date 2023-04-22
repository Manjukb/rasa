import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('supplier_category_product')
export class SupplierCategoryProduct {
    @PrimaryColumn()
    public id: string;

    @Column()
    public supplier_id: string;

    @Column({ type: 'jsonb' })
    public category_ids: string[] | null;

    @Column({ type: 'jsonb' })
    public sub_category_ids: string[] | null;

    @Column({ type: 'jsonb' })
    public product_ids: string[] | null;

    @CreateDateColumn({ name: 'created_date', type: 'timestamp without time zone' })
    public created_date: Date;

    @UpdateDateColumn({ name: 'updated_date', type: 'timestamp without time zone' })
    public updated_date: Date;
}
