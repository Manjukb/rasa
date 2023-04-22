import { Constant, env } from '../helpers';
import { ErrorModel, ResponseViewModel } from '../viewmodels/response-viewmodel';
import { Next, Request, Response } from 'restify';

import { SuccessResponse } from '../viewmodels/response';

export const ApiMiddleware = async (request: Request, response: Response, next: Next): Promise<void> => {
    const middlewareResponse = new ResponseViewModel<SuccessResponse>();
    const header = request.headers;
    const authorizationToken = request.headers.authorization;
    const apiToken = env.API_TOKEN;
    const inputApiToken = authorizationToken?.split(Constant.TOKEN_PREFIX)[1];

    if (!header || !authorizationToken || !inputApiToken) {
        middlewareResponse.errors.push(new ErrorModel(Constant.ERROR_MESSAGES.UNAUTHORIZED_ACCESS));

        return response.send(401, middlewareResponse);
    }

    if (apiToken !== inputApiToken) {
        middlewareResponse.errors.push(new ErrorModel('Authorization token is incorrect', 'invalid-token'));

        return response.send(401, middlewareResponse);
    }

    next();
};
