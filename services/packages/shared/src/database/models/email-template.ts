import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('email_template')
export class EmailTemplate {
    @PrimaryColumn()
    public id: string;

    @Column()
    public organisation_id: string;

    @Column()
    template_type: string;

    @Column()
    subject: string;

    @Column()
    message: string;
}
