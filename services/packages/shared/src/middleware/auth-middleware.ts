import * as JWT from 'jsonwebtoken';

import { Constant, env } from '../helpers';
import { DecodedTokenResponse, SuccessResponse } from '../viewmodels/response';
import { ErrorModel, ResponseViewModel } from '../viewmodels/response-viewmodel';
import { Next, Response } from 'restify';

import { HandshakeFactory } from '../factories';
import { Roles } from '../enum';
import { WithUserRequest } from '../types/request-type';

const getToken = (request: WithUserRequest) => {
    const header = request.headers;
    const authorizationToken = request.headers.authorization;
    const jwtToken = authorizationToken?.split(Constant.TOKEN_PREFIX)[1];
    if (!header || !authorizationToken || !jwtToken) {
        return null;
    }
    return jwtToken;
};
const decodeToken = (jwtToken: string): { userId?: string; role?: string; error?: string; tenantId?: string } => {
    if (!jwtToken) {
        return { error: Constant.ERROR_MESSAGES.DEFAULT_TOKEN_ERROR };
    }
    try {
        const token = new DecodedTokenResponse();
        Object.assign(token, JWT.verify(jwtToken, env.JWT_SECRET));
        return { userId: token.user_id, role: token.role, tenantId: token.tenant_id };
    } catch (error) {
        console.error('Token decoding failed, error is', error);
        // if invalid token is passed
        if (error.name === Constant.ERROR_TYPES.JSON_WEB_TOKEN_ERROR) {
            return { error: Constant.ERROR_MESSAGES.JSON_WEB_TOKEN_ERROR };
        }
        //if token is expired
        if (error.name === Constant.ERROR_TYPES.TOKEN_EXPIRED_ERROR) {
            return { error: Constant.ERROR_MESSAGES.TOKEN_EXPIRED_ERROR };
        }
        // another errors
        return { error: Constant.ERROR_MESSAGES.DEFAULT_TOKEN_ERROR };
    }
};

const setUserInRequest = async (
    request: WithUserRequest,
    userId: string,
    role: string,
    tenantId?: string,
): Promise<ErrorModel[] | null> => {
    if (!userId) {
        return null;
    }
    const userRole = role || Roles.enterprise_user;
    const service = HandshakeFactory.getServiceByUserRole(userRole);
    const userResponse = await service.getUser(userId);

    if (ResponseViewModel.hasErrors(userResponse)) {
        return userResponse.errors;
    }
    request.user = userResponse.data;
    tenantId && (request.user.tenant_id = tenantId);

    return null;
};

export const GetAndSetCurrentUser = async (request: WithUserRequest): Promise<void> => {
    const token = getToken(request);
    const { userId, role, tenantId } = decodeToken(token);
    await setUserInRequest(request, userId, role, tenantId);
};

export const AuthMiddleware = async (request: WithUserRequest, response: Response, next: Next): Promise<void> => {
    const middlewareResponse = new ResponseViewModel<SuccessResponse>();
    const jwtToken = getToken(request);
    if (!jwtToken) {
        middlewareResponse.errors.push(new ErrorModel(Constant.ERROR_MESSAGES.UNAUTHORIZED_ACCESS));

        return response.send(401, middlewareResponse);
    }

    const { userId, role, error, tenantId } = decodeToken(jwtToken);
    if (error) {
        middlewareResponse.errors.push(new ErrorModel(error));
        return response.send(401, middlewareResponse);
    }
    const errors = await setUserInRequest(request, userId, role, tenantId);
    if (errors) {
        middlewareResponse.errors = errors;
        return response.send(401, middlewareResponse);
    }
    next();
};
