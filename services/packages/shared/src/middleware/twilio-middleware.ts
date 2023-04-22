import { ErrorModel, ResponseViewModel } from '../viewmodels/response-viewmodel';
import { Next, Request, Response } from 'restify';

import { SuccessResponse } from '../viewmodels/response';
import { env } from '../helpers';
import { validateRequest } from 'twilio';

export const TwilioMiddleware = async (request: Request, response: Response, next: Next): Promise<void> => {
    console.info(env.ENVIRONMENT === 'LOCAL', env.ENVIRONMENT);
    if (env.ENVIRONMENT === 'LOCAL' || env.ENVIRONMENT === 'dev') {
        next();
        return;
    }

    const middlewareResponse = new ResponseViewModel<SuccessResponse>();
    const signature = request.header('x-twilio-signature', '');

    const params = request.body || {};
    const authToken = env.TWILIO_AUTH_TOKEN;
    const url = env.TWILIO_CHAT_URL;

    const isValidRequest = validateRequest(authToken, signature, url, params);
    if (!isValidRequest) {
        middlewareResponse.errors.push(new ErrorModel('Twilio webhook request validation is failed'));

        return response.send(401, middlewareResponse);
    }

    next();
};
