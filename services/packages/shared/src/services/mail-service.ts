import { CompanySupplierHandShaking, ForgotPassword, WelcomeSupplier, WelcomeUser } from '../templates/';
import { CompanySupplierHandShakingEvent, MailQueueMessageType, SupplierWebhooksEvent, WelcomeEmail } from '../types/';
import { Mailer, env } from '../helpers';

import { ClientResponse } from '@sendgrid/client/src/response';
import { IMailOptions } from '../interfaces/index';
import { injectable, inject } from 'inversify';
import { SettingServiceContract, UserOrganisationServiceContract } from '.';
import moment = require('moment');

export interface MailServiceContract {
    sendWelcomeMail(welcomeEmail: WelcomeEmail): Promise<ClientResponse>;
    sendForgotPasswordMail(welcomeEmail: WelcomeEmail): Promise<ClientResponse>;
    sendWelcomeSupplier(data: SupplierWebhooksEvent): Promise<ClientResponse>;
    sendWelCompanySupplierHandshakingMail(data: CompanySupplierHandShakingEvent): Promise<ClientResponse>;
    sendRfqMail(emails: string[], message: MailQueueMessageType): Promise<void>;
    toTimeZone(time: Date, timeZone: string): string;
}

@injectable()
export class MailService implements MailServiceContract {
    public constructor(
        @inject('SettingService') private readonly settingService: SettingServiceContract,
        @inject('UserOrganisationService') private readonly userOrganisationService: UserOrganisationServiceContract,
    ) {}

    private async addActualEmailLine(mail: string | string[]): Promise<string> {
        const email = Array.isArray(mail) ? mail[0] : mail;
        const isEnableEmailTrue = await this.getUserSetting(email);
        if (isEnableEmailTrue) {
            return '';
        }
        if (typeof mail === 'string') {
            return env.ENVIRONMENT !== 'prod'
                ? `<p> Since, environment is <u><em>${env.ENVIRONMENT}</em></u>, so mail is sent to <u><em>${env.DEV_RECIPIENT_EMAIL}</em></u> instead of sending mail to <u></em>${mail}</em></u></p>`
                : '';
        }
        return env.ENVIRONMENT !== 'prod'
            ? `<p> Since, environment is <u><em>${env.ENVIRONMENT}</em></u>, so mail is sent to <u><em>${
                  env.DEV_RECIPIENT_EMAIL
              }</em></u> instead of sending mail to <u></em>${mail.toString()}</em></u></p>`
            : '';
    }

    private async getActualRecipientEmail(email: string): Promise<string> {
        const isEnableEmailTrue = await this.getUserSetting(email);
        if (isEnableEmailTrue) {
            console.log('email: ', email);
            console.log('Direct Mail');
            return email;
        }
        return env.ENVIRONMENT !== 'prod' ? env.DEV_RECIPIENT_EMAIL : email;
    }

    public async sendWelcomeMail(welcomeEmail: WelcomeEmail): Promise<ClientResponse> {
        let welcomeMailTemplate = new WelcomeUser(welcomeEmail).template;
        welcomeMailTemplate += await this.addActualEmailLine(welcomeEmail.email);
        const mailOptions: IMailOptions = {
            subject: 'Welcome to Negobot',
            html: welcomeMailTemplate,
            to: await this.getActualRecipientEmail(welcomeEmail.email),
        };

        const response = await Mailer.sendMail(mailOptions);

        return response;
    }

    public async sendForgotPasswordMail(welcomeEmail: WelcomeEmail): Promise<ClientResponse> {
        let mailTemplate = new ForgotPassword(welcomeEmail).template;
        mailTemplate += await this.addActualEmailLine(welcomeEmail.email);

        const mailOptions: IMailOptions = {
            subject: 'Reset Password for Negobot',
            html: mailTemplate,
            to: await this.getActualRecipientEmail(welcomeEmail.email),
        };

        const response = await Mailer.sendMail(mailOptions);

        return response;
    }
    public async sendWelcomeSupplier(data: SupplierWebhooksEvent): Promise<ClientResponse> {
        let mailTemplate = new WelcomeSupplier(data).template;
        mailTemplate += await this.addActualEmailLine(data.email);
        const recipient = await this.getActualRecipientEmail(data.email);
        const mailOptions: IMailOptions = {
            subject: 'Welcome to Negobot',
            html: mailTemplate,
            to: recipient,
        };

        const response = await Mailer.sendMail(mailOptions);

        return response;
    }
    public async sendWelCompanySupplierHandshakingMail(data: CompanySupplierHandShakingEvent): Promise<ClientResponse> {
        let mailTemplate = new CompanySupplierHandShaking(data).template;
        mailTemplate += await this.addActualEmailLine(data.email);

        const mailOptions: IMailOptions = {
            subject: `Start Business with ${data.company_name}`,
            html: mailTemplate,
            to: await this.getActualRecipientEmail(data.email),
        };
        const response = await Mailer.sendMail(mailOptions);

        return response;
    }

    private async sendMailForRfq(email: string, message: MailQueueMessageType): Promise<ClientResponse> {
        let mailTemplate = message.content;
        mailTemplate += await this.addActualEmailLine(email);
        const to = email;
        //const bcc = env.ENVIRONMENT !== 'prod' ? emails.slice(0) : [];

        const mailOptions: IMailOptions = {
            subject: message.subject,
            html: mailTemplate,
            to: await this.getActualRecipientEmail(to),
        };

        const response = await Mailer.sendMail(mailOptions);

        return response;
    }

    public toTimeZone(time: Date, timeZone: string): string {
        const convertedTime = moment.tz(time, timeZone).format('LLL ([GMT] Z)');
        return convertedTime;
    }

    public async sendRfqMail(emails: string[], message: MailQueueMessageType): Promise<void> {
        emails.forEach(
            async (email): Promise<void> => {
                await this.sendMailForRfq(email, message);
            },
        );
    }

    private async getUserSetting(email: string): Promise<boolean> {
        const user = (await this.userOrganisationService.getUser({ email })).data;
        if (!user.organisation_id) {
            return false;
        }
        const organisationId = user.organisation_id;
        const setting = await this.settingService.getById(organisationId);
        const settings = setting && setting.settings;
        if (setting && settings.enable_email === true) {
            return true;
        }
        return false;
    }
}
