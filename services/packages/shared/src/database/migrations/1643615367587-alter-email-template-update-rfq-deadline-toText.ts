import { MigrationInterface, QueryRunner } from 'typeorm';

import { EmailTemplate } from '../..';
import { TemplateType } from '../../enum/template-type';

export class alterEmailTemplateUpdateRfqDeadlineToText1643615367587 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const checkTemplate = await queryRunner.manager.findOne(EmailTemplate, {
            template_type: TemplateType.RFQInvitation,
        });

        const message = `Dear Sir/Madam,

        Thank you for your ongoing relationship with our organisation. We are requesting for quotations for {{categories}} that we target to close by {{rfq_end_date}}. We request you to provide us your first response to our RFQ Reference No: {{rfq_number}} information latest by {{rfq_date}}. 
        
        To view the RFQ and provide the quote, please click on the link: <a href="{{rfq_link}}">RFQ Link</a>
        
        Please note that we will not be able to accept any quotes that are provided outside our workflow accessible only from the link provided above. Please do not send us any direct emails or use any other channel of communication for an official quote. Thank you!
        
        Thank You
        Procurement Manager
        {{organisation_name}}`;

        if (checkTemplate) {
            await queryRunner.manager
                .createQueryBuilder()
                .update(EmailTemplate)
                .set({ message: message })
                .where({ template_type: TemplateType.RFQInvitation })
                .execute();
        }
    }

    public async down(): Promise<void> {
        console.warn('no need to update message again');
    }
}
