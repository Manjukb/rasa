import * as bcrypt from 'bcryptjs';

import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn, UpdateDateColumn } from 'typeorm';

import { Organisation } from './organisation';
import { Supplier } from './supplier';
import { UserInfo } from '../../types/';

@Entity('user')
export class User {
    public hashPassword(): void {
        this.password_hash = bcrypt.hashSync(this.password_hash, 8);
    }

    @PrimaryColumn({ name: 'id' })
    public id: string;

    @Column()
    public user_id: string;

    @Column()
    public authority: string;

    @Column({ select: false })
    public password_hash: string;

    @Column()
    public password_key: string;

    @CreateDateColumn({ name: 'password_key_valid_till', type: 'timestamp without time zone' })
    public password_key_valid_till: Date;

    @Column({ type: 'simple-json' })
    public user_info: UserInfo;

    @Column()
    public name: string;

    @Column()
    public email: string;

    @Column()
    public business_type: string;

    public business_types: string[];

    @CreateDateColumn({ name: 'created_date', type: 'timestamp without time zone' })
    public created_date: Date;

    @UpdateDateColumn({ name: 'updated_date', type: 'timestamp without time zone' })
    public updated_date: Date;

    @Column()
    public user_status: boolean;

    @ManyToOne(() => User, (user) => user.id)
    @JoinColumn({ name: 'created_by' })
    public creater: User;

    @Column({ nullable: true })
    public created_by: string | null;

    @ManyToOne(() => User, (user) => user.id)
    @JoinColumn({ name: 'updated_by' })
    public updater: User;

    @Column({ nullable: true })
    public updated_by: string | null;

    @Column()
    public organisation_id: string;

    @ManyToOne(() => Organisation, (organisation) => organisation.organisation_id)
    @JoinColumn({ name: 'organisation_id', referencedColumnName: 'organisation_id' })
    public organisation: Organisation;

    @Column({ nullable: true })
    public phone: string | null;

    @Column()
    public supplier_id: string;

    @ManyToOne(() => Supplier, (supplier) => supplier.id)
    @JoinColumn({ name: 'supplier_id', referencedColumnName: 'id' })
    public supplier: Supplier;
}
