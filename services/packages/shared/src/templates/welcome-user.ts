import { Constant, Util, env } from '../helpers';

import { WelcomeEmail } from '../types/';

export class WelcomeUser {
    public template: string;

    public constructor(welcomeEmail: WelcomeEmail) {
        this.template = `
        <strong>Dear ${welcomeEmail.name},</strong>
        <p>
           Welcome to Negobot,
        </p>
        <p>
        You have just been signed up for our revolutionary platform that helps you negotiate and close deals with your buyers seamlessly.
        </p>
        <p>
        Please read this brief <a href="http://www.negobot.co/">walk through</a> to understand how the solution works.        
        </p>
        <p>
        Please <a href= ${env.PUBLIC_URL}/auth/reset-password?key=${welcomeEmail.password_key}&type=${
            Constant.MAIL_TYPES.WELCOME
        }>click here</a> to complete your sign-up for your complimentary Negobot service.
        </p>

        Happy selling!<br>
        <i>Negobot & ${Util.capitalize(welcomeEmail.client_name)}</i>
        `;
    }
}
