import { Constant, Util, env } from '../helpers';

import { WelcomeEmail } from '../types/';

export class ForgotPassword {
    public template: string;

    public constructor(welcomeEmail: WelcomeEmail) {
        this.template = `
        <strong>Dear ${Util.capitalize(welcomeEmail.name)},</strong>
        <p>
        Someone requested a password reset for <a href="http://www.negobot.co/">Negobot</a>. If this was you, <a href= ${
            env.PUBLIC_URL
        }/auth/reset-password?key=${welcomeEmail.password_key}&type=${
            Constant.MAIL_TYPES.RESET_PASSWORD
        }>click here</a> to reset password. If you did not request a new password, ignore this email and nothing will happen.
        </p>
        <p>

        Happy selling!<br>
        <i>Negobot ${welcomeEmail.client_name && `& ${Util.capitalize(welcomeEmail.client_name)}`}</i>
        `;
    }
}
