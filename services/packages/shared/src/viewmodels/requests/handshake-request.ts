import { Organisation } from '../../database/models';

export class ModifyTenantRequest {
    public tenant_id: string;
    public tenant_name: string;
    public tenant_type: string;
    public organisation: Organisation;
}
export class HandshakeRequest extends ModifyTenantRequest {
    public api_key: string;
    public user_name: string;
    public user_identifier: string;
    public user_role: string;
    public referer: string; // for some internal processing
}

export class CustomerHandshakeRequest extends HandshakeRequest {
    public customer_id: string;
    public customer_name: string;
    public history?: false;
}
