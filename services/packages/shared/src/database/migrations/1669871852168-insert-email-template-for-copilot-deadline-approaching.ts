import { MigrationInterface, QueryRunner } from 'typeorm';

import { EmailTemplate } from '../..';
import { TemplateType } from '../../enum/template-type';

export class insertEmailTemplateForCopilotDeadlineApproaching1669871852168 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const checkTemplate = await queryRunner.manager.findOne(EmailTemplate, {
            template_type: TemplateType.RFQCopilotDeadlineApproaching,
        });

        const template = new EmailTemplate();
        template.id = 'df113d08bc06420ca374b24fa34ee58b';
        template.organisation_id = null;
        template.template_type = TemplateType.RFQCopilotDeadlineApproaching;
        template.subject = 'Please submit your offer for RFQ RefNo:{{rfq_number}}';
        template.message = `<!DOCTYPE html>
        <html lang="en">
          <head>
            <title>RfqCopilotDeadlineApproaching</title>
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
                        <p>Please Submit Offer</p>
                        <p>RFQ RefNo: {{rfq_number}}</p>
                    </h3>
                </header>
        
                <main>
                    <div style="background-color: ghostwhite; border-radius: 4px; padding: 24px 48px;">
                        <p>
                            Dear Sir/Madam, 
                        </p>
                        <p>
                            Thank you for your ongoing engagement. Please note that the deadline for you to provide your response to our ongoing RFQ negotiation is {{co_pilot_deadline}}. We will not accept any quotes that we receive in the system after that.
                        </p>
                        Please note that we will not be able to accept any quotes that are provided outside our workflow accessible only from the link here <a href="{{rfq_link}}"><button style="background-color: #29a0b1;
                            color: white;
                            text-align: center;
                            text-decoration: none;
                            display: inline-block;
                            font-size: 20px;
                            border-radius: 10px;
                            cursor: pointer;">RFQ Link</button></a>
                        . Please do not send us any direct emails or use any other channel of communication for an official quote.
                        <p style="color: red;"><em>*Please ignore this email if you have already submitted offer.</em></p>
                        <p>
                            Thank You<br>
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
            template_type: TemplateType.RFQCopilotDeadlineApproaching,
        });
    }
}
