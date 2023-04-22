import { MigrationInterface, QueryRunner } from 'typeorm';

import { EmailTemplate } from '../models';
import { TemplateType } from '../../enum/template-type';

export class insertEmailTemplateRfqAward1641531810085 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const checkTemplate = await queryRunner.manager.findOne(EmailTemplate, {
            template_type: TemplateType.RFQAwarded,
        });

        const template = new EmailTemplate();
        template.id = '5d0621ee501940f7b03a5c1afe50ddfc';
        template.organisation_id = null;
        template.template_type = TemplateType.RFQAwarded;
        template.subject = 'Award RFQ RefNo:{{rfq_number}}';
        template.message = `<p>Dear Sir/Madam,</p>
        <p>Thank you for your ongoing relationship with our organisation. We have completed to procure {{categories}} by {{rfq_end_date}}. We inform you that you have {{rfq_status}} RFQ RefNo: {{rfq_number}}.</p>
        <p>To view the RFQ please click on the link: <a href="{{rfq_link}}">RFQ Link</a></p>
        <p>Thank You<br />Procurement Manager<br />{{organisation_name}}</p>`;

        if (checkTemplate == undefined) {
            await queryRunner.manager.insert(EmailTemplate, template);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.manager.delete(EmailTemplate, {
            template_type: TemplateType.RFQAwarded,
        });
    }
}
