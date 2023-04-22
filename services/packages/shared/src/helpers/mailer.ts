import * as sgMail from '@sendgrid/mail';

import { ClientResponse } from '@sendgrid/client/src/response';
import { IMailOptions } from '../interfaces/index';
import { env } from './index';

class MailHelper {
    public async sendMail(mailOptions: IMailOptions): Promise<ClientResponse> {
        sgMail.setApiKey(env.SENDGRID_KEY);
        const response = await sgMail.send({
            ...mailOptions,
            from: {
                name: 'Negobot',
                email: env.SENDGRID_SENDER_EMAIL,
            },
        });

        return response[0];
    }
}

const Mailer = new MailHelper();

export { Mailer };
