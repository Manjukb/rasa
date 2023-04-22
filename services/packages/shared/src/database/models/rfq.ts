import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { Parameter, RfqNegoProcess } from '../..';

import { Organisation } from './organisation';
import { User } from './user';

@Entity('rfq')
export class Rfq {
    @PrimaryColumn()
    public id: string;

    @Column()
    public organisation_id: string;

    // @Column()
    // public target_saving_rate: number;

    // @Column({ type: 'simple-json' })
    // public payment_terms: { baseline_value: number; is_negotiable: boolean };

    // @Column({ type: 'simple-json' })
    // public contract_terms: { baseline_value: number; is_negotiable: boolean };

    @Column()
    public winner_supplier_id: string;

    @Column()
    public status: string;

    @Column()
    public created_by: string;

    @Column()
    public updated_by: string;

    @CreateDateColumn({ name: 'created_date', type: 'timestamp without time zone' })
    public created_date: Date;

    @UpdateDateColumn({ name: 'updated_date', type: 'timestamp without time zone' })
    public updated_date: Date;

    @ManyToOne(() => Organisation, (organisation) => organisation.organisation_id)
    @JoinColumn({ name: 'organisation_id', referencedColumnName: 'organisation_id' })
    public organisation: Organisation;

    @ManyToOne(() => User, (user) => user.user_id, { nullable: false })
    @JoinColumn({ name: 'created_by', referencedColumnName: 'user_id' })
    public creator: User;

    @ManyToOne(() => User, (user) => user.user_id, { nullable: false })
    @JoinColumn({ name: 'updated_by', referencedColumnName: 'user_id' })
    public updater: User;

    @ManyToOne(() => User, (user) => user.user_id, { nullable: false })
    @JoinColumn({ name: 'winner_supplier_id', referencedColumnName: 'user_id' })
    public winnerSupplier: User;

    @Column({ type: 'simple-json' })
    public parameter: Parameter | null;

    @Column({ name: 'launch_date', type: 'timestamp with time zone' })
    public launch_date?: Date;

    @Column({ type: 'simple-json' })
    public negotiation_process: RfqNegoProcess | null;

    @Column()
    public rfq_number: number;

    @Column({ type: 'jsonb' })
    public category_ids: string[];

    @Column()
    public buyer_id?: number;

    @Column()
    public supplier_id?: number;

    @Column({ type: 'jsonb' })
    public product_ids?: string[];
}
