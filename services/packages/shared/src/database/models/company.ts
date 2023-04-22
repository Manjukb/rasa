import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn, UpdateDateColumn } from 'typeorm';

import { User } from './user';
import { Organisation } from './organisation';

@Entity('company')
export class Company {
    @PrimaryColumn()
    public id: string;

    @Column()
    public name: string;

    @Column()
    public address: string;

    @Column()
    public organisation_id: string;

    @Column()
    public is_active: boolean;

    @Column()
    public created_by: string | null;

    @Column()
    public updated_by: string | null;

    @CreateDateColumn({ name: 'created_date', type: 'timestamp without time zone' })
    public created_date: Date;

    @UpdateDateColumn({ name: 'updated_date', type: 'timestamp without time zone' })
    public updated_date: Date;

    @ManyToOne(() => User, (creator) => creator.id)
    @JoinColumn({ name: 'created_by', referencedColumnName: 'id' })
    public creator: User;

    @ManyToOne(() => Organisation, (organisation) => organisation.organisation_id)
    @JoinColumn({ name: 'organisation_id', referencedColumnName: 'organisation_id' })
    public organisation: Organisation;
}
