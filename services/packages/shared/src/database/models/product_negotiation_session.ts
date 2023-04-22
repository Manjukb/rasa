import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn, UpdateDateColumn } from 'typeorm';

import { Organisation } from './organisation';

@Entity('product_negotiation_session')
export class NegotiationSession {
    @PrimaryColumn({ name: 'id' })
    public id: number;

    @Column()
    public organisation_id: string;

    @Column()
    public product_id: string;

    @Column()
    public session_id: string;

    @Column()
    public customer_email: string;

    @Column()
    public session_status: string;

    @Column({ type: 'simple-json' })
    public negotiation_session: string;

    @CreateDateColumn({ name: 'created_date', type: 'timestamp without time zone' })
    public created_date: Date;

    @UpdateDateColumn({ name: 'updated_date', type: 'timestamp without time zone' })
    public updated_date: Date;

    @ManyToOne(() => Organisation, (organisation) => organisation.organisation_id)
    @JoinColumn({ name: 'organisation_id', referencedColumnName: 'organisation_id' })
    public organisation: Organisation;
}
