import { MigrationInterface, QueryRunner } from 'typeorm';

import { EmailTemplate } from '../models';
import { TemplateType } from '../../enum/template-type';

export class insertEmailTemplate1634817535474 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const checkTemplate = await queryRunner.manager.findOne(EmailTemplate, {
            id: 'f7c0a42ef2484b67ae717302b393b672',
        });

        const template = new EmailTemplate();
        template.id = 'f7c0a42ef2484b67ae717302b393b672';
        template.organisation_id = null;
        template.template_type = TemplateType.RFQInvitation;
        template.subject = 'Request for Quotes | RFQ RefNo:{{rfq_number}} | Quote by {{rfq_date}}';
        template.message = `
        Dear Sir/Madam,
        
        Thank you for your ongoing relationship with our organisation. We are seeking to procure {{categories}} for our
        office staff by {{rfq_end_date}}. We request you to provide us a quote information latest by {{rfq_date}}.         
        
        To view the RFQ and upload the quote please click on the link: <a href="{{rfq_link}}">RFQ Link</a>          
        
        Thank You
        Procurement Manager
        {{organisation_name}}`;

        if (checkTemplate == undefined) {
            await queryRunner.manager.save(template);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.manager.delete(EmailTemplate, { id: 'f7c0a42ef2484b67ae717302b393b672' });
    }
}
