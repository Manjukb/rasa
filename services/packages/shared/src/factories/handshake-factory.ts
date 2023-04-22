import { Constant, Util } from '../helpers';
import { CustomerHandshakeRequest, HandshakeRequest } from '../viewmodels/requests';
import {
    CustomerServiceContract,
    TenantServiceContract,
    TenantUserServiceContract,
    UserServiceContract,
} from '../services';

import { Bootstrapper } from '../bootstrap/bootstrapper';
import { ClientType } from '../enum';
import { RequestUserResponse } from '../viewmodels/response';

export class HandshakeFactory {
    public static get(
        handshakeRequest: HandshakeRequest,
    ): UserServiceContract | TenantServiceContract | CustomerServiceContract {
        const container = Bootstrapper.getContainer();
        if ((handshakeRequest as CustomerHandshakeRequest).customer_id) {
            return container.get<CustomerServiceContract>('CustomerService');
        }
        const clientType = handshakeRequest.organisation.client_type;
        if (clientType === ClientType.enterprise) {
            return container.get<UserServiceContract>('UserService');
        }
        return container.get<TenantServiceContract>('TenantService');
    }

    public static getServiceByTenant(user: RequestUserResponse): UserServiceContract | TenantUserServiceContract {
        const container = Bootstrapper.getContainer();
        if (!user.tenant_id) {
            const userServiceContract = container.get<UserServiceContract>('UserService');

            return userServiceContract;
        }
        const contract = container.get<TenantUserServiceContract>('TenantUserService');

        return contract;
    }

    public static getServiceByUserRole(
        userRole: string,
    ): UserServiceContract | TenantUserServiceContract | CustomerServiceContract {
        const userGroup = Util.getUserGroupTypeByRole(userRole);

        const container = Bootstrapper.getContainer();

        if (userGroup === Constant.userGroupTypes.tenantUser) {
            const tenantServiceContract = container.get<TenantUserServiceContract>('TenantUserService');

            return tenantServiceContract;
        }
        if (userGroup === Constant.userGroupTypes.customer) {
            const customerServiceContract = container.get<CustomerServiceContract>('CustomerService');

            return customerServiceContract;
        }

        const userServiceContract = container.get<UserServiceContract>('UserService');

        return userServiceContract;
    }
}
