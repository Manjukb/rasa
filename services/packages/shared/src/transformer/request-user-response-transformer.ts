import { RequestUserResponse } from '../viewmodels/response';
import { User } from '../database/models';

export class RequestUserResponseTransformer {
    public static transform(user: User): RequestUserResponse {
        const userResponse = new RequestUserResponse();
        userResponse.user_id = user.user_id;
        userResponse.name = user.name;
        userResponse.email = user.email;
        userResponse.role = user.authority;
        userResponse.status = user.user_status;
        userResponse.business_types = user.business_type ? user.business_type.split(',') : [];
        userResponse.tenant_id = null;
        userResponse.organisation_id = user.organisation_id;
        userResponse.is_on_channel = false; // will complete for enterprise client
        userResponse.supplier_id = user.supplier_id;
        return userResponse;
    }
}
