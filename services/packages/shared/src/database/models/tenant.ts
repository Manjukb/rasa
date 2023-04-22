import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn, UpdateDateColumn } from 'typeorm';

import { Organisation } from './organisation';

@Entity('tenant')
export class Tenant {
    @PrimaryColumn()
    public id: string;

    @Column()
    public name: string;

    @Column()
    public identifier: string;

    @Column()
    public business_type: string;

    @Column()
    public is_active: boolean;

    @Column()
    public is_bot_active: boolean;

    @Column()
    public organisation_id: string;

    @CreateDateColumn({ name: 'created_date', type: 'timestamp without time zone' })
    public created_date: Date;

    @UpdateDateColumn({ name: 'updated_date', type: 'timestamp without time zone' })
    public updated_date: Date;

    @Column({ name: 'deleted_date', type: 'timestamp without time zone' })
    public deleted_date: Date | null;

    @ManyToOne(() => Organisation, (organisation) => organisation.organisation_id)
    @JoinColumn({ name: 'organisation_id', referencedColumnName: 'organisation_id' })
    public organisation: Organisation;
}
