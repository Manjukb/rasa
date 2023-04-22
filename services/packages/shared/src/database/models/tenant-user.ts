import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn, UpdateDateColumn } from 'typeorm';

import { Tenant } from './tenant';

@Entity('tenant_user')
export class TenantUser {
    @PrimaryColumn()
    public id: string;

    @Column()
    public name: string;

    @Column()
    public identifier: string;

    @Column()
    public role: string;

    @Column()
    public is_active: boolean;

    @Column()
    public is_on_channel: boolean;

    @Column()
    public tenant_id: string;

    @CreateDateColumn({ name: 'created_date', type: 'timestamp without time zone' })
    public created_date: Date;

    @UpdateDateColumn({ name: 'updated_date', type: 'timestamp without time zone' })
    public updated_date: Date;

    @Column({ name: 'deleted_date', type: 'timestamp without time zone' })
    public deleted_date: Date | null;

    @ManyToOne(() => Tenant, (tenant) => tenant.id)
    @JoinColumn({ name: 'tenant_id', referencedColumnName: 'id' })
    public tenant: Tenant;
}
