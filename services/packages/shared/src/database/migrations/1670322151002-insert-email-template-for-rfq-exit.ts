import { MigrationInterface, QueryRunner } from 'typeorm';

import { EmailTemplate } from '../..';
import { TemplateType } from '../../enum/template-type';

export class insertEmailTemplateForRfqExit1670322151002 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const checkTemplate = await queryRunner.manager.findOne(EmailTemplate, {
            template_type: TemplateType.RFQExited,
        });

        const template = new EmailTemplate();
        template.id = 'cb16464357f44c7593bdccdd4c8d20bf';
        template.organisation_id = null;
        template.template_type = TemplateType.RFQExited;
        template.subject =
            'Thank you for your participation!, RFQ RefNo:{{rfq_number}} has been closed by {{rfq_close_date}}.';
        template.message = `<!DOCTYPE html>
        <html lang="en">
          <head>
            <title>RfqExited</title>
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
                        <p>RFQ Closed!!!</p>
                        <p>RFQ RefNo: {{rfq_number}}</p>
                    </h3>
                </header>
        
                <main>
                    <div style="background-color: ghostwhite; border-radius: 4px; padding: 24px 48px;">
                        <p>
                            Dear Sir/Madam, 
                        </p>
                        <p>
                            Thank you for your engagement and participation in the RFQ process for RFQ Reference No: {{rfq_number}}. We would like to inform you that this RFQ has been closed without being awarded to any supplier. We thank you for your interest and participation in the process.
                        </p>        
                        <p>
                            We will be in touch for future RFQs.
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

        if (checkTemplate == undefined) {
            await queryRunner.manager.insert(EmailTemplate, template);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.manager.delete(EmailTemplate, {
            template_type: TemplateType.RFQExited,
        });
    }
}
