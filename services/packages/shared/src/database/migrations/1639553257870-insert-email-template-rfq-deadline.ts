import { MigrationInterface, QueryRunner } from 'typeorm';

import { EmailTemplate } from '../models';
import { TemplateType } from '../../enum/template-type';

export class insertEmailTemplateRfqDeadline1639553257870 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "email_template"
        ALTER COLUMN "template_type" TYPE varchar(56)`);

        const checkTemplate = await queryRunner.manager.findOne(EmailTemplate, {
            template_type: TemplateType.RFQDeadlineApproaching,
        });

        const template = new EmailTemplate();
        template.id = '49a6754d88c94c1994180d4c1dd7d302';
        template.organisation_id = null;
        template.template_type = TemplateType.RFQDeadlineApproaching;
        template.subject = 'Please submit your offer for RFQ RefNo:{{rfq_number}}';
        template.message = `Dear Sir/Madam,
        
        Thank you for your ongoing relationship with our organisation. We are seeking to procure {{categories}} for our office staff by {{rfq_end_date}}. We request you to provide us a quote information latest by {{rfq_date}}.         
                        
        To view the RFQ and upload the quote please click on the link: <a href="{{rfq_link}}">RFQ Link</a>          
                        
        Thank You
        Procurement Manager
        {{organisation_name}}`;

        if (checkTemplate == undefined) {
            await queryRunner.manager.insert(EmailTemplate, template);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.manager.delete(EmailTemplate, {
            template_type: TemplateType.RFQDeadlineApproaching,
        });
    }
}
