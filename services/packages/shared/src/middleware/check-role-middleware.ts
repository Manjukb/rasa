import { ErrorModel, ResponseViewModel } from '../viewmodels/response-viewmodel';
import { Next, Response } from 'restify';

import { Constant } from '../helpers';
import { SuccessResponse } from '../viewmodels/response';
import { WithUserRequest } from '../types/request-type';

export const CheckRoleMiddleware = (roles: string[]) => {
    return (req: WithUserRequest, res: Response, next: Next): void => {
        const userRole = req.user.role;

        //Check if array of authorized roles includes the user's authority(role)
        if (roles.indexOf(userRole) > -1) {
            next();

            return;
        }

        const response = new ResponseViewModel<SuccessResponse>();
        response.errors.push(new ErrorModel(Constant.ERROR_MESSAGES.UNAUTHORIZED_ACCESS));
        res.send(401, response);
        next(false);

        return;
    };
};
