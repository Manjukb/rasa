import * as Yup from 'yup';

import { ErrorModel, ResponseViewModel } from '@negobot/shared/';

import { ICreatedBy } from '@negobot/shared/';
import { Request } from 'restify';
import { WithUserRequest } from '@negobot/shared/';
import { injectable } from 'inversify';

@injectable()
export class ControllerBase {
    protected validate<T>(
        request: Request | WithUserRequest,
        validator: Yup.ObjectSchema,
    ): Promise<ResponseViewModel<T | null> | null> {
        return new Promise(
            async (resolve): Promise<Promise<ResponseViewModel<T | null>> | void> => {
                const body = request.body || {};
                body.auth_user_id = '';
                if (request.method && request.method === 'PUT') {
                    body.id = request.params?.id;
                }
                if (request) {
                    const requestObject = Object(request);
                    const user = requestObject.user;
                    if (user && user.user_id) {
                        body.user = user;
                        body.auth_user_id = user.user_id;
                        body.auth_user_organisation_id = user.organisation_id;
                        body.auth_user_tenant_id = user.tenant_id;
                        body.auth_user_role = user.role;
                    }
                }
                const errorResponse = new ResponseViewModel<T | null>();
                errorResponse.data = null;
                try {
                    await validator.validate(body, { abortEarly: false });
                    resolve(null);
                    return;
                } catch (validationErrors) {
                    const properties: string[] = [];
                    validationErrors.inner.forEach((validationError: Yup.ValidationError): void => {
                        if (!properties.includes(validationError.path)) {
                            errorResponse.errors.push(new ErrorModel(validationError.message, validationError.path));
                            properties.push(validationError.path);
                        }
                    });
                }
                resolve(errorResponse);
            },
        );
    }

    protected transform<T extends ICreatedBy>(request: WithUserRequest, TCreator: { new (): T }): T {
        const method = request.method ?? '';
        const user = request.user;
        const requestModel = new TCreator();

        Object.assign(requestModel, request.body);
        if (user.user_id && method === 'POST') {
            requestModel.created_by = user.user_id;
            requestModel.updated_by = user.user_id;
        } else if (user.user_id && method === 'PUT') {
            requestModel.updated_by = user.user_id;
        }

        return requestModel;
    }

    protected withOutAuthTransform<T>(request: Request, TCreator: { new (): T }, readyQuerystring?: boolean): T {
        const requestModel = new TCreator();
        Object.assign(requestModel, readyQuerystring === true ? request.query : request.body);

        return requestModel;
    }

    protected queryTransform<T>(request: Request, TCreator: { new (): T }): T {
        const requestModel = new TCreator();
        Object.assign(requestModel, request.query);

        return requestModel;
    }

    protected cast<T>(request: Request): T {
        return (request as unknown) as T;
    }
}
