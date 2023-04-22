import * as JWT from 'jsonwebtoken';

import { Constant, env } from '../helpers';
import { DecodedTokenResponse, SuccessResponse } from '../viewmodels/response';
import { ErrorModel, ResponseViewModel } from '../viewmodels/response-viewmodel';
import { Next, Response } from 'restify';

import { Bootstrapper } from '../bootstrap/bootstrapper';
import { CustomerServiceContract } from '../services';
import { WithUserRequest } from '../types/request-type';

export const CustomerAuthMiddleware = async (
    request: WithUserRequest,
    response: Response,
    next: Next,
): Promise<void> => {
    const middlewareResponse = new ResponseViewModel<SuccessResponse>();
    const header = request.headers;
    const authorizationToken = request.headers.authorization;
    const jwtToken = authorizationToken?.split(Constant.TOKEN_PREFIX)[1];

    if (!header || !authorizationToken || !jwtToken) {
        middlewareResponse.errors.push(new ErrorModel(Constant.ERROR_MESSAGES.UNAUTHORIZED_ACCESS));

        return response.send(401, middlewareResponse);
    }

    if (jwtToken) {
        try {
            const token = new DecodedTokenResponse();
            Object.assign(token, JWT.verify(jwtToken, env.JWT_SECRET));
            const organisationId = token.organisation_id || null;
            const container = Bootstrapper.getContainer();
            const service = container.get<CustomerServiceContract>('CustomerService');

            const userResponse = await service.getUser(token.user_id, organisationId);

            if (userResponse.errors && userResponse.errors.length) {
                middlewareResponse.errors = userResponse.errors;

                return response.send(401, middlewareResponse);
            }

            request.user = userResponse.data;
        } catch (error) {
            // if invalid token is passed
            if (error.name === Constant.ERROR_TYPES.JSON_WEB_TOKEN_ERROR) {
                middlewareResponse.errors.push(new ErrorModel(Constant.ERROR_MESSAGES.JSON_WEB_TOKEN_ERROR));

                return response.send(401, middlewareResponse);
            }
            //if token is expired
            if (error.name === Constant.ERROR_TYPES.TOKEN_EXPIRED_ERROR) {
                middlewareResponse.errors.push(new ErrorModel(Constant.ERROR_MESSAGES.TOKEN_EXPIRED_ERROR));

                return response.send(401, middlewareResponse);
            }
            // another errors
            middlewareResponse.errors.push(new ErrorModel(Constant.ERROR_MESSAGES.DEFAULT_TOKEN_ERROR));

            return response.send(401, middlewareResponse);
        }
    }
    next();
};
