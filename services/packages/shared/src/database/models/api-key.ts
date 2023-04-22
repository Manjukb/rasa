import { Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryColumn } from 'typeorm';

import { Organisation } from './organisation';
import { User } from './user';

@Entity('api_key')
export class ApiKey {
    @PrimaryColumn()
    public id: string;

    @Column()
    public organisation_id: string;

    @OneToOne(() => Organisation, (organisation) => organisation.organisation_id)
    @JoinColumn({ name: 'organisation_id', referencedColumnName: 'organisation_id' })
    public organisation: Organisation;

    @Column()
    public user_id: string;

    @Column()
    public business_type: string;

    @ManyToOne(() => User, (user) => user.user_id)
    @JoinColumn({ name: 'user_id' })
    public user: User;

    @Column()
    public api_key: string;

    @Column()
    public authority: string;

    @Column()
    public is_active: boolean;

    @Column({ name: 'issued_date', type: 'timestamp without time zone' })
    public issued_date: Date;

    @Column({ name: 'expired_date', type: 'timestamp without time zone' })
    public expired_date: Date;

    @Column({ name: 'deleted_date', type: 'timestamp without time zone' })
    public deleted_date: Date;
}
