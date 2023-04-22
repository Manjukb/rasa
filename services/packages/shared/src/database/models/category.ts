import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn, UpdateDateColumn } from 'typeorm';

import { Organisation } from './organisation';
import { User } from './user';

@Entity('category')
export class Category {
    @PrimaryColumn()
    public id: string;

    @Column()
    public name: string;

    @Column()
    public parent_id: string;

    public parent_name?: string | null;

    // @Column()
    // public business_type: string;

    @Column()
    public is_active: boolean;

    @Column()
    public organisation_id: string;

    @Column()
    public tenant_id: string;

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
}
