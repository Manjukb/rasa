import { MigrationInterface, QueryRunner } from 'typeorm';

import { EmailTemplate } from '../models';
import { TemplateType } from '../../enum/template-type';

export class insertEmailTemplateRfqAwardReject1649665614223 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const checkTemplate = await queryRunner.manager.findOne(EmailTemplate, {
            template_type: TemplateType.RFQAwardedReject,
        });

        const template = new EmailTemplate();
        template.id = '00810751da74411280407aa7f8a1e7c5';
        template.organisation_id = null;
        template.template_type = TemplateType.RFQAwardedReject;
        template.subject = 'Award RFQ Reject';
        template.message = `<p>Dear Procurement Manager,</p>
        <p>Thank you for the RFQ offer. Unfortunately, I'm not able to accept your offer as of now.</p>
        <p>Thank You<br />Supplier<br /></p>`;

        if (checkTemplate == undefined) {
            await queryRunner.manager.insert(EmailTemplate, template);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.manager.delete(EmailTemplate, {
            template_type: TemplateType.RFQAwardedReject,
        });
    }
}
