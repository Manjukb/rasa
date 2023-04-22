import { OrganisationLightWeightResponseTransformer } from './organisation-light-weight-response-transformer';
import { User } from '../database/models';
import { UserResponse } from '../viewmodels/response';

export class UserResponseTransformer {
    public static transform(user: User): UserResponse {
        const userResponse = new UserResponse();
        userResponse.id = user.id;
        userResponse.user_id = user.user_id;
        userResponse.email = user.email;
        userResponse.name = user.user_info.name || '';
        userResponse.role = user.authority;
        userResponse.status = user.user_status;
        userResponse.business_types = user.business_type ? user.business_type.split(',') : [];
        userResponse.organisation_id = user.organisation_id;
        userResponse.tenant_id = null;
        userResponse.supplier_id = user.supplier_id;
        userResponse.organisation = OrganisationLightWeightResponseTransformer.transform(user.organisation);

        return userResponse;
    }

    public static transformList(users: User[]): UserResponse[] {
        const response = users.map(
            (user: User): UserResponse => {
                const userResponse = this.transform(user);

                return userResponse;
            },
        );

        return response;
    }
}
