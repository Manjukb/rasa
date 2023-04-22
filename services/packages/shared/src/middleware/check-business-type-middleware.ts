import { ErrorModel, ResponseViewModel } from '../viewmodels/response-viewmodel';
import { Next, Response } from 'restify';

import { Constant } from '../helpers';
import { SuccessResponse } from '../viewmodels/response';
import { WithUserRequest } from '../types/request-type';

export const CheckBusinessTypeMiddleware = (businessTypes: string[]) => {
    return (req: WithUserRequest, res: Response, next: Next): void => {
        const userBusinessTypes: string[] = req.user.business_types ?? [];

        const hasRequiredBusinessType = businessTypes.some((businessType) => userBusinessTypes.includes(businessType));
        if (hasRequiredBusinessType) {
            return next();
        }

        const response = new ResponseViewModel<SuccessResponse>();
        response.errors.push(new ErrorModel(Constant.ERROR_MESSAGES.UNAUTHORIZED_ACCESS));
        res.send(401, response);
        next(false);

        return;
    };
};
