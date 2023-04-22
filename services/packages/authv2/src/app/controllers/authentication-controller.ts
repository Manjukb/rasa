import { ControllerBase } from './controller-base';
import { AuthMiddleware, ResponseViewModel, UserResponse, WithUserRequest } from '@negobot/shared/';
import { Controller, Get, interfaces, Post } from 'inversify-restify-utils';
import { inject, injectable } from 'inversify';
import { Request } from 'restify';
import { AuthenticationServiceContract, UserServiceContract } from '@negobot/shared/';
import { AuthenticationRequest, SetPasswordRequest } from '@negobot/shared/';
import { AuthenticationResponse, MessageResponse } from '@negobot/shared/';
import { AuthenticateUserValidator, ForgotPasswordValidator, SetPasswordValidator } from '@negobot/shared/';
import { TrimMiddleware } from '@negobot/shared/';
import { User } from '@negobot/shared/';

@Controller('')
@injectable()
export class AuthenticationController extends ControllerBase implements interfaces.Controller {
    public constructor(
        @inject('AuthenticationService') private readonly authenticationService: AuthenticationServiceContract,
        @inject('UserService') private readonly userService: UserServiceContract,
    ) {
        super();
    }

    @Get('/version')
    public async version(): Promise<ResponseViewModel<string>> {
        const response = new ResponseViewModel<string>();
        response.data = 'hello world';
        return response;
    }

    @Post('/authenticate')
    public async login(request: Request): Promise<ResponseViewModel<AuthenticationResponse | null> | null> {
        const validationResult = await super.validate<AuthenticationResponse>(request, AuthenticateUserValidator);
        if (validationResult) {
            return validationResult;
        }

        const authenticationRequest = super.withOutAuthTransform<AuthenticationRequest>(request, AuthenticationRequest);

        return this.authenticationService.login(authenticationRequest);
    }

    @Get('/me', AuthMiddleware)
    public async getCurrentUser(request: WithUserRequest): Promise<ResponseViewModel<UserResponse>> {
        const user = request.user;

        return this.authenticationService.me(user);
    }

    @Post('/forgot-password', TrimMiddleware)
    public async forgotPassword(request: Request): Promise<ResponseViewModel<MessageResponse | null> | null> {
        const validationResult = await super.validate<MessageResponse>(request, ForgotPasswordValidator);
        if (validationResult) {
            return validationResult;
        }

        const forgotPasswordRequest = super.withOutAuthTransform<AuthenticationRequest>(request, AuthenticationRequest);

        return this.userService.sendForgotPasswordEmail(forgotPasswordRequest.email);
    }

    @Post('/set-password', TrimMiddleware)
    public async setPassword(request: Request): Promise<ResponseViewModel<MessageResponse | null> | null> {
        const validationResult = await super.validate<MessageResponse>(request, SetPasswordValidator);
        if (validationResult) {
            return validationResult;
        }

        const setPasswordRequest = super.withOutAuthTransform<SetPasswordRequest>(request, SetPasswordRequest);

        return this.authenticationService.setUserPassword(setPasswordRequest);
    }

    @Get('/get-user-by-password-key/:passwordKey', TrimMiddleware)
    public async getUserByPasswordKey(request: Request): Promise<ResponseViewModel<User>> {
        const { passwordKey } = request.params;

        return this.userService.getUserByPasswordKey(passwordKey);
    }
}
