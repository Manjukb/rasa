import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { Organisation } from './organisation';
import { User } from './user';

@Entity('organisation_company_supplier')
export class OrganisationCompanySupplier {
    @PrimaryColumn()
    public id: string;

    @Column()
    public organisation_id: string;

    @Column()
    public company_id: string;

    @Column()
    public user_id: string;

    @CreateDateColumn({ name: 'created_date', type: 'timestamp without time zone' })
    public created_date: Date;

    @UpdateDateColumn({ name: 'updated_date', type: 'timestamp without time zone' })
    public updated_date: Date;

    @ManyToOne(() => Organisation, (organisation) => organisation.organisation_id)
    @JoinColumn({ name: 'organisation_id', referencedColumnName: 'organisation_id' })
    public organisation: Organisation;

    @ManyToOne(() => User, (user) => user.user_id)
    @JoinColumn({ name: 'user_id', referencedColumnName: 'user_id' })
    public user: User;

    @ManyToOne(() => Organisation, (company) => company.organisation_id)
    @JoinColumn({ name: 'company_id', referencedColumnName: 'organisation_id' })
    public company: Organisation;
}
