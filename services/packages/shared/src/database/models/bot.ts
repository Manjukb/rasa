import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn, UpdateDateColumn } from 'typeorm';

import { Organisation } from './organisation';
import { Parameter } from '../../types/parameter';
import { Tenant } from './tenant';

@Entity('bot')
export class Bot {
    @PrimaryColumn({ name: 'id' })
    public id: string;

    @CreateDateColumn({ name: 'created_date', type: 'timestamp without time zone' })
    public created_date: Date;

    @UpdateDateColumn({ name: 'updated_date', type: 'timestamp without time zone' })
    public updated_date: Date;

    @Column()
    public updated_by: string;

    @Column()
    public organisation_id: string;

    @ManyToOne(() => Organisation, (organisation) => organisation.organisation_id)
    @JoinColumn({ name: 'organisation_id', referencedColumnName: 'organisation_id' })
    public organisation: Organisation;

    @Column()
    public metric_id: string;

    @Column({ type: 'simple-json' })
    public negotiation_metric: Parameter;

    @Column()
    public business_type: string;

    @Column()
    public tenant_id: string;

    @Column({ type: 'jsonb' })
    public category_ids: string[];

    @Column()
    public is_default: number;

    @ManyToOne(() => Tenant, (tenant) => tenant.id)
    @JoinColumn({ name: 'tenant_id', referencedColumnName: 'id' })
    public tenant: Tenant;
}
