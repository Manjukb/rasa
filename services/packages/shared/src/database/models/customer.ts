import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn, UpdateDateColumn } from 'typeorm';

import { Organisation } from './organisation';

@Entity('customer')
export class Customer {
    @PrimaryColumn()
    public id: string;

    @Column()
    public name: string;

    @Column()
    public identifier: string;

    @Column()
    public organisation_id: string;

    @Column()
    public is_active: boolean;

    @Column()
    public is_on_channel: boolean;

    @CreateDateColumn({ name: 'created_date', type: 'timestamp without time zone' })
    public created_date: Date;

    @UpdateDateColumn({ name: 'updated_date', type: 'timestamp without time zone' })
    public updated_date: Date;

    @ManyToOne(() => Organisation, (organisation) => organisation.organisation_id)
    @JoinColumn({ name: 'organisation_id', referencedColumnName: 'organisation_id' })
    public organisation: Organisation;
}
