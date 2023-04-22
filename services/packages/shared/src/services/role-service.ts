import { Constant } from '../helpers';
import { RequestUserResponse } from '../viewmodels/response';
import { Roles } from '../enum';
import { injectable } from 'inversify';

export interface RoleServiceContract {
    isSuperAdmin(user: RequestUserResponse): boolean;
    isAdmin(user: RequestUserResponse): boolean;
}

@injectable()
export class RoleService implements RoleServiceContract {
    public isSuperAdmin(user: RequestUserResponse): boolean {
        return user.role === Roles.super_admin;
    }

    public isAdmin(user: RequestUserResponse): boolean {
        return Constant.clientAdminRoles.includes(user.role);
    }

    public isTenantUser(user: RequestUserResponse): boolean {
        return user.role === Roles.tenant_user;
    }

    public isTenantAdmin(user: RequestUserResponse): boolean {
        return user.role === Roles.tenant_admin;
    }
}
