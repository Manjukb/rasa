import { ErrorModel, ResponseViewModel } from '../viewmodels/response-viewmodel';
import { RequestUserResponse, SuccessResponse } from '../viewmodels/response';
import { injectable, inject } from 'inversify';
import { UserOrganisationServiceContract } from './user-organisation-service';

export interface PermissionServiceContract {
    canUpdateUser(user: RequestUserResponse, requestedUserId: string): Promise<ResponseViewModel<SuccessResponse>>;
}

@injectable()
export class PermissionService implements PermissionServiceContract {
    public constructor(
        @inject('UserOrganisationService') private readonly userOrganisationService: UserOrganisationServiceContract,
    ) {}

    public async canUpdateUser(
        user: RequestUserResponse,
        requestedUserId: string,
    ): Promise<ResponseViewModel<SuccessResponse>> {
        // Admin can update user only if the passed user_id is of organisation
        // you can't update other organisation user
        const response = new ResponseViewModel<SuccessResponse>();
        const requestedUserResponse = await this.userOrganisationService.getUser({ userId: requestedUserId });
        if (requestedUserResponse.errors && requestedUserResponse.errors.length) {
            response.errors = requestedUserResponse.errors;

            return response;
        }

        if (requestedUserResponse.data && requestedUserResponse.data.organisation_id !== user.organisation_id) {
            response.errors.push(new ErrorModel('Requested user is not of user organisation'));

            return response;
        }

        response.data = { success: true };

        return response;
    }
}
