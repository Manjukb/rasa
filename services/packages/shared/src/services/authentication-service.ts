import * as bcrypt from 'bcryptjs';
import * as jsonwebtoken from 'jsonwebtoken';

import { Constant, env } from '../helpers';
import { ErrorModel, ResponseViewModel } from '../viewmodels/response-viewmodel';

import { AuthenticationRequest, SetPasswordRequest } from '../viewmodels/requests';
import { AuthenticationResponse, MessageResponse, RequestUserResponse, UserResponse } from '../viewmodels/response';
import { inject, injectable } from 'inversify';
import { UserServiceContract } from './user-service';
import { HandshakeFactory } from '../factories';

export interface AuthenticationServiceContract {
    login(authenticationRequest: AuthenticationRequest): Promise<ResponseViewModel<AuthenticationResponse>>;
    me(user: RequestUserResponse): Promise<ResponseViewModel<UserResponse>>;
    setUserPassword(setPasswordRequest: SetPasswordRequest): Promise<ResponseViewModel<MessageResponse>>;
}

@injectable()
export class AuthenticationService implements AuthenticationServiceContract {
    public constructor(@inject('UserService') private readonly userService: UserServiceContract) {}

    public async login(
        authenticationRequest: AuthenticationRequest,
    ): Promise<ResponseViewModel<AuthenticationResponse>> {
        const response = new ResponseViewModel<AuthenticationResponse>();

        const user = (await this.userService.getUserToAuth(authenticationRequest.email)).data;
        if (user && !user.user_status) {
            response.errors.push(new ErrorModel(Constant.ERROR_MESSAGES.ACCOUNT_DEACTIVATED));

            return response;
        }

        if (user && bcrypt.compareSync(authenticationRequest.password, user.password_hash)) {
            const jwtToken = jsonwebtoken.sign(
                {
                    user_id: user.user_id,
                    role: user.authority,
                    negobot: {
                        user_id: user.user_id,
                        organisation_id: user.organisation_id,
                        authority: user.authority,
                    },
                },
                env.JWT_SECRET,
                {
                    expiresIn: '1d',
                },
            );
            const businessTypes = user.business_type ? user.business_type.split(',') : [];

            response.data = {
                id: user.id,
                user_id: user.user_id,
                email: user.email,
                role: user.authority,
                supplier_id: user.supplier_id,
                token: jwtToken,
                business_types: businessTypes,
                organisation_id: user.organisation_id,
                client_type: user.organisation.client_type,
            };

            return response;
        }

        response.errors.push(new ErrorModel(Constant.ERROR_MESSAGES.INCORRECT_LOGIN_DETAIL));

        return response;
    }

    public async me(user: RequestUserResponse): Promise<ResponseViewModel<UserResponse>> {
        const service = HandshakeFactory.getServiceByTenant(user);

        return service.getLightWeight(user);
    }

    public async setUserPassword(setPasswordRequest: SetPasswordRequest): Promise<ResponseViewModel<MessageResponse>> {
        return await this.userService.setUserPassword(setPasswordRequest);
    }
}
