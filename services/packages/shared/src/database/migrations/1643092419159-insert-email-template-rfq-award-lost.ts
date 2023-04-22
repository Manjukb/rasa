import { MigrationInterface, QueryRunner } from 'typeorm';

import { EmailTemplate } from '../..';
import { TemplateType } from '../../enum/template-type';

export class insertEmailTemplateRfqAwardLost1643092419159 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const checkTemplate = await queryRunner.manager.findOne(EmailTemplate, {
            template_type: TemplateType.RFQAwardedLost,
        });

        const template = new EmailTemplate();
        template.id = '3b8fee3965654fd8a65203b5a5595c0d';
        template.organisation_id = null;
        template.template_type = TemplateType.RFQAwardedLost;
        template.subject = 'Award RFQ RefNo:{{rfq_number}}';
        template.message = `<!DOCTYPE html>
        <html lang="en">
          <head>
            <title>AwardRfqLost</title>
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
                        <p>LOST!!!</p>
                        <p>RFQ RefNo: {{rfq_number}}</p>
                    </h3>
                </header>
        
                <main>
                    <div style="background-color: ghostwhite; border-radius: 4px; padding: 24px 48px;">
                        <p>
                            Dear {{supplier_name}}, 
                        </p>
                        <p>
                            Thank you for your engagement and participation in the RFQ process for RFQ Reference No: {{rfq_number}}.
                        </p>        
                        <p>
                            I am afraid your bid for this RFQ was not successful. We thank you for your proactive and active participation in the process, and hope to engage with you soon for our procurement needs again soon.
                        </p>
                        <p>
                            We would greatly appreciate your feedback with the entire process in the link provided below: <a href="{{link_to_get_feedback_from_the_losing_rfq_supplier}}"><button style="background-color: #29a0b1;
                                color: white;
                                text-align: center;
                                text-decoration: none;
                                display: inline-block;
                                font-size: 20px;
                                border-radius: 10px;
                                cursor: pointer;">RFQ Link</button></a>.
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
            template_type: TemplateType.RFQAwardedLost,
        });
    }
}
