import { MigrationInterface, QueryRunner } from 'typeorm';

import { EmailTemplate } from '../..';
import { TemplateType } from '../../enum/template-type';

export class insertEmailTemplateSupplierOfferSubmission1641790486420 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const checkTemplate = await queryRunner.manager.findOne(EmailTemplate, {
            template_type: TemplateType.RFQSupplierOfferSubmitted,
        });

        const template = new EmailTemplate();
        template.id = '7a496c4a27b541a6af2f9dd59974e526';
        template.organisation_id = null;
        template.template_type = TemplateType.RFQSupplierOfferSubmitted;
        template.subject = 'Offer submission for RFQ RefNo:{{rfq_number}}';
        template.message = `<p>Dear Sir/Madam,</p>
        <p>Thank you for your ongoing relationship with our organisation. We inform that you have submitted offer for RFQ RefNo: {{rfq_number}} successfully by {rfq_offer_submit_date}.</p>
        <p>Please check back again later for further updates. For that please click on the link: <a href="{{rfq_link}}">RFQ Link</a></p>
        <p>Thank You<br />Procurement Manager<br />{{organisation_name}}</p>`;

        if (checkTemplate == undefined) {
            await queryRunner.manager.save(EmailTemplate, template);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.manager.delete(EmailTemplate, {
            template_type: TemplateType.RFQSupplierOfferSubmitted,
        });
    }
}
