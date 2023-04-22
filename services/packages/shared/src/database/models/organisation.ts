import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    OneToOne,
    PrimaryColumn,
    UpdateDateColumn,
} from 'typeorm';

import { ApiKey } from './api-key';
import { OrganisationInfo } from '../../types';
import { User } from './user';
import { OrganisationSettings } from '../../types/organisation-info';

@Entity('organisation')
export class Organisation {
    @PrimaryColumn()
    public id: string;

    @Column()
    public organisation_id: string;

    @Column()
    public name: string;

    @Column({ type: 'simple-json' })
    public organisation_info: OrganisationInfo;

    @Column({ type: 'simple-json' })
    public organisation_settings: OrganisationSettings;

    @CreateDateColumn({ name: 'created_date', type: 'timestamp without time zone' })
    public created_date: Date;

    @UpdateDateColumn({ name: 'updated_date', type: 'timestamp without time zone' })
    public updated_date: Date;

    @Column()
    public business_type: string;

    public business_types: string[];

    @Column()
    public client_type: string;

    @Column()
    public is_active: boolean;

    @Column()
    public domains: string;

    @ManyToOne(() => User, (user) => user.user_id, { nullable: false })
    @JoinColumn({ name: 'created_by', referencedColumnName: 'user_id' })
    public creater: User;

    @Column()
    public created_by: string;

    @ManyToOne(() => User, (user) => user.user_id, { nullable: false })
    @JoinColumn({ name: 'updated_by', referencedColumnName: 'user_id' })
    public updater: User;

    @Column()
    public updated_by: string;

    @OneToOne(() => ApiKey, (apiKey) => apiKey.organisation_id) // specify inverse side as a second parameter
    @JoinColumn({ name: 'organisation_id', referencedColumnName: 'organisation_id' })
    public api: ApiKey;

    @OneToMany(() => User, (user) => user.organisation)
    users: User[];

    @OneToMany(() => ApiKey, (apiKey) => apiKey.organisation)
    apiKeys: ApiKey[];

    @Column()
    public address: string | null;

    @Column()
    public timezone: string;
}
