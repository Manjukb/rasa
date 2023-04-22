import * as dotenv from 'dotenv';
import * as path from 'path';

class Env {
    /**
     * Makes env configs available for your app
     * throughout the app's runtime
     */
    public static config(): {
        PORT: number;
        JWT_SECRET: string;
        PER_PAGE: number;
        APP_NAME: string;
        ENVIRONMENT: string;
        PUBLIC_URL: string;
        BUGSNAG_API_KEY: string;
        IS_BUGSNAG_ENABLED: boolean;
        TIMEZONE_OFFSET: number;
        SENDGRID_KEY: string;
        SENDGRID_SENDER_EMAIL: string;
        DEV_RECIPIENT_EMAIL: string;
        API_TOKEN: string;
        TWILIO_CHAT_URL: string;
        TWILIO_AUTH_TOKEN: string;
        TWILIO_ACCOUNT_SID: string;
        TWILIO_SERVICE_ID: string;
        TWILIO_API_KEY: string;
        TWILIO_API_SECRET: string;
        TWILIO_CHANNEL_ADMIN_GUID: string;
        PROCUREMENT_AUTO_ACCEPT_SCORE: number;
        BOT_COUNTER_OFFER_DELAY: number;
        MINIMUM_ACCEPTANCE_THRESHOLD: number;
        FLOOR_VALUE_SAVING_TARGET: number;
    } {
        // we will try to find env in ..<src>/..<shared>/..<packages> level
        dotenv.config({ path: path.join(__dirname, '../../../.env') });

        const ENVIRONMENT = process.env.environment || 'LOCAL';
        const PORT = process.env.port ? +process.env.port : 4201;
        const JWT_SECRET = process.env.jwt_secret || 'randomText';
        const SENDGRID_KEY = process.env.sendgrid_key || 'randomText';
        const SENDGRID_SENDER_EMAIL = process.env.sendgrid_sender_email || 'no-reply@negobot.co';
        const DEV_RECIPIENT_EMAIL =
            process.env.dev_recipient_email || 'fe83ecb0e52543709a3ec213d4c5310c@mailinator.com';

        const PER_PAGE = 100;

        // APP Meta Data
        const APP_NAME = process.env.app_name || 'Example';
        const PUBLIC_URL = process.env.public_url || '';

        const IS_BUGSNAG_ENABLED = process.env.is_bugsnag_enabled
            ? process.env.is_bugsnag_enabled.toLowerCase() === 'true'
                ? true
                : false
            : false;

        const BUGSNAG_API_KEY = IS_BUGSNAG_ENABLED ? process.env.bugsnag_api_key || '' : '';
        const TIMEZONE_OFFSET = process.env.TIMEZONE_OFFSET ? parseInt(process.env.TIMEZONE_OFFSET) : 19800;
        const API_TOKEN = process.env.api_token || 'PYAYMMy9t6Te2wus';
        const TWILIO_AUTH_TOKEN = process.env.twilio_auth_token || '';
        const TWILIO_CHAT_URL = process.env.twilio_chat_url || '';
        const TWILIO_ACCOUNT_SID = process.env.twilio_account_sid || '';
        const TWILIO_SERVICE_ID = process.env.twilio_service_id || '';
        const TWILIO_API_KEY = process.env.twilio_api_key || '';
        const TWILIO_API_SECRET = process.env.twilio_api_secret || '';
        const TWILIO_CHANNEL_ADMIN_GUID = process.env.twilio_channel_admin_guid || 'NEG-DA0E5ABD387C465281BD';
        const PROCUREMENT_AUTO_ACCEPT_SCORE = +(process.env.procurement_auto_accept_score || 0.8);
        const MINIMUM_ACCEPTANCE_THRESHOLD = +(process.env.procurement_max_concession_score || 0.3);
        const FLOOR_VALUE_SAVING_TARGET = +(process.env.floor_value_saving_target || 2);
        // delay in seconds by which counter offer is made by the bot, a negative value means bot will only make offer during scheduled run
        const BOT_COUNTER_OFFER_DELAY = +(process.env.procurement_auto_accept_score || 60);
        return {
            PORT,
            JWT_SECRET,
            PER_PAGE,
            APP_NAME,
            ENVIRONMENT,
            PUBLIC_URL,
            BUGSNAG_API_KEY,
            IS_BUGSNAG_ENABLED,
            TIMEZONE_OFFSET,
            SENDGRID_KEY,
            SENDGRID_SENDER_EMAIL,
            DEV_RECIPIENT_EMAIL,
            API_TOKEN,
            TWILIO_AUTH_TOKEN,
            TWILIO_CHAT_URL,
            TWILIO_ACCOUNT_SID,
            TWILIO_SERVICE_ID,
            TWILIO_API_KEY,
            TWILIO_API_SECRET,
            TWILIO_CHANNEL_ADMIN_GUID,
            PROCUREMENT_AUTO_ACCEPT_SCORE,
            BOT_COUNTER_OFFER_DELAY,
            MINIMUM_ACCEPTANCE_THRESHOLD,
            FLOOR_VALUE_SAVING_TARGET,
        };
    }
}

const env = Env.config();
export { env };
