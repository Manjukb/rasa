import { MigrationInterface, QueryRunner } from 'typeorm';

import { EmailTemplate } from '../models';
import { TemplateType } from '../../enum/template-type';

export class alterEmailTemplateRfqAwardWon1649838134357 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const checkTemplate = await queryRunner.manager.findOne(EmailTemplate, {
            template_type: TemplateType.RFQAwardedWon,
        });

        const subject = 'Award RFQ RefNo:{{rfq_number}}';
        const message = `<!DOCTYPE html>
        <html lang="en">
          <head>
            <title>AwardRfqWon</title>
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
                        <p>WON!!!</p>
                        <p>RFQ RefNo: {{rfq_number}}</p>
                    </h3>
                </header>
        
                <main>
                    <div style="background-color: ghostwhite; border-radius: 4px; padding: 24px 48px;">
                        <p>
                            Dear {{supplier_name}}, 
                        </p>
                        <p>
                            Thank you for accepting the contract for RFQ Reference No: {{rfq_number}}. Please click on the RFQ Link <a href="{{rfq_award_won_link}}"><button style="background-color: #29a0b1;
                                color: white;
                                text-align: center;
                                text-decoration: none;
                                display: inline-block;
                                font-size: 20px;
                                border-radius: 10px;
                                cursor: pointer;">RFQ Link</button></a> for more details.
                        </p>
                        <p>
                            Congratulations, and we look forward to a productive relationship with your firm.
                        </p>
                        <p>
                            Best regards,<br>
                            Procurement Manager<br>
                            {{organisation_name}}
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

        if (checkTemplate) {
            await queryRunner.manager
                .createQueryBuilder()
                .update(EmailTemplate)
                .set({ subject: subject, message: message })
                .where({ template_type: TemplateType.RFQAwardedWon })
                .execute();
        }
    }

    public async down(): Promise<void> {
        console.warn('no need to update message again');
    }
}
