import { MigrationInterface, QueryRunner } from 'typeorm';

import { EmailTemplate } from '../..';
import { TemplateType } from '../../enum/template-type';

export class insertEmailTemplateFinalRoundOfferSubmittedProcurement1643093439402 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const checkTemplate = await queryRunner.manager.findOne(EmailTemplate, {
            template_type: TemplateType.FinalRoundOfferSubmittedProcurement,
        });

        const template = new EmailTemplate();
        template.id = '19e594322825449ca6d0e1d9f88fad96';
        template.organisation_id = null;
        template.template_type = TemplateType.FinalRoundOfferSubmittedProcurement;
        template.subject = 'All Suppliers Offer Submission for RFQ RefNo:{{rfq_number}}';
        template.message = `<!DOCTYPE html>
        <html lang="en">
          <head>
            <title>FinalRoundOfferSubmittedProcurement</title>
            <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <meta http-equiv="X-UA-Compatible" content="IE=edge" />
          </head>
          <body style="margin: 0 !important; padding: 0 !important;">
        
            <div role="article" lang="en" style="background-color: #167d7f; color: #2b2b2b; font-family: 'Avenir Next', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; font-size: 18px; font-weight: 400; line-height: 28px; margin: 0 auto; max-width: 600px; padding: 40px 20px 40px 20px;">
                <header>
                    <a>
                        <center><img src="https://dev.app.negobot.co/static/negobot.0b902978.png" alt="" height="80" width="80"></center>
                    </a>
                    <h3 style="color: #000000; font-size: 32px; font-weight: 800; line-height: 32px; margin: 48px 0; text-align: center;">
                        <p>Final Round Completed</p>
                        <p>RFQ RefNo: {{rfq_number}}</p>
                    </h3>
                </header>
                
                <main>
                    <div style="background-color: ghostwhite; border-radius: 4px; padding: 24px 48px;">
                        <p>
                            Dear {{procurement_manager}}, 
                        </p>
                        <p>
                            All suppliers who met the deadline to submit their bids for final Round {{negotiation_round_no}} have submitted their bids RFQ Reference No: {{rfq_number}}. You can view the latest status of the negotiation from this link: <a href="{{link_to_rfq_negotiation_detail_table}}"><button style="background-color: #29a0b1;
                                color: white;
                                text-align: center;
                                text-decoration: none;
                                display: inline-block;
                                font-size: 20px;
                                border-radius: 10px;
                                cursor: pointer;">RFQ Link</button></a>.
                        </p>
                        <p style="color: red;"><em>*Please review the final offers and award the RFQ.</em></p>                
                        <p>
                            Thank You!
                        </p>
                    </div>
                </main>
        
                <footer>
                    <address style="text-align: center; font-size: 16px; font-style: normal; font-weight: 400; line-height: 24px; margin-top: 48px;">
                        <strong>Copyright &#169; Negobot {{current_year}}</strong>
                    </address>
                </footer>
        
            </div>
          </body>
        </html>
        `;

        if (checkTemplate == undefined) {
            await queryRunner.manager.insert(EmailTemplate, template);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.manager.delete(EmailTemplate, {
            template_type: TemplateType.FinalRoundOfferSubmittedProcurement,
        });
    }
}
