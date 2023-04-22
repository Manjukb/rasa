import { HandshakeRequest } from './handshake-request';

export class TenantUserRequest {
    public tenant_id: string;
    public name: string;
    public identifier: string;
    public role: string;

    public constructor(request: HandshakeRequest, tenant_id: string) {
        this.tenant_id = tenant_id;
        this.name = request.user_name;
        this.identifier = request.user_identifier;
        this.role = request.user_role;

        return this;
    }
}
