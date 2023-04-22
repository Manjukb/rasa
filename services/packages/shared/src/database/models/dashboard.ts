import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('dashboard')
export class Dashboard {
    @PrimaryColumn()
    public id: string;

    @Column()
    public organisation_id: string;

    @Column()
    public organisation_name: string;

    @Column()
    public rfq_id: string;

    @Column({ type: 'timestamp without time zone' })
    public rfq_created_date: Date;

    @Column()
    public rfq_status: string;

    @Column({ type: 'jsonb' })
    public rfq_supplier_ids: string[];

    @Column({ type: 'jsonb' })
    public rfq_supplier_user_ids: string[];

    @Column({ type: 'jsonb' })
    public rfq_supplier_names: string[];

    @Column({ type: 'timestamp without time zone' })
    public rfq_awarded_date: Date;

    @Column()
    public purchase_type: string;

    @Column()
    public total_historic_price: number;

    @Column()
    public revised_baseline_price: number;

    @Column()
    public rfq_awarded_price: number;

    @Column()
    public total_savings: number;

    @Column()
    public winner_supplier_id: string;

    @Column()
    public winner_supplier_name: string;

    @Column()
    public winner_supplier_company_name: string;

    @Column({ type: 'jsonb' })
    public product_ids: string[];

    @Column({ type: 'jsonb' })
    public product_names: string[];

    @Column('simple-json', { default: null })
    public category: Record<string, unknown>;
}
