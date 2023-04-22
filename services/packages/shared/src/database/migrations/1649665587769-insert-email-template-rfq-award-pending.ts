import { MigrationInterface, QueryRunner } from 'typeorm';

import { EmailTemplate } from '../models';
import { TemplateType } from '../../enum/template-type';

export class insertEmailTemplateRfqAwardPending1649665587769 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const checkTemplate = await queryRunner.manager.findOne(EmailTemplate, {
            template_type: TemplateType.RFQAwardedPending,
        });

        const template = new EmailTemplate();
        template.id = '4a75c24de6d643648f1454e782a2808d';
        template.organisation_id = null;
        template.template_type = TemplateType.RFQAwardedPending;
        template.subject = 'Award RFQ Pending';
        template.message = `<p>Dear Sir/Madam,</p>
        <p>Thank you for your ongoing relationship with our organisation. Please confirm that you're accepting the RFQ.</p>
        <p>Thank You<br />Procurement Manager<br /></p>`;

        if (checkTemplate == undefined) {
            await queryRunner.manager.insert(EmailTemplate, template);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.manager.delete(EmailTemplate, {
            template_type: TemplateType.RFQAwardedPending,
        });
    }
}
