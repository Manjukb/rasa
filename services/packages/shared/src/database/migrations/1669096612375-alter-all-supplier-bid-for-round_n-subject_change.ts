import { MigrationInterface, QueryRunner } from 'typeorm';

import { EmailTemplate } from '../..';
import { TemplateType } from '../../enum/template-type';

export class alterAllSupplierBidForRoundNSubjectChange1669096612375 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const checkTemplate = await queryRunner.manager.findOne(EmailTemplate, {
            template_type: TemplateType.AllSuppliersRoundOfferSubmittedProcurement,
        });

        const subject = `Co-pilot intervention deadline is {{co_pilot_deadline}} for RFQ RefNo:{{rfq_number}}`;
        if (checkTemplate) {
            await queryRunner.manager
                .createQueryBuilder()
                .update(EmailTemplate)
                .set({ subject: subject })
                .where({ template_type: TemplateType.AllSuppliersRoundOfferSubmittedProcurement })
                .execute();
        }
    }

    public async down(): Promise<void> {
        console.warn('no need to update message again');
    }
}
