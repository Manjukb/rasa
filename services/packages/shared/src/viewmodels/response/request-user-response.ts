export class RequestUserResponse {
    public user_id: string;
    public email: string;
    public role: string;
    public status: boolean;
    public business_types?: string[];
    public organisation_id: string;
    public tenant_id?: string;
    public name?: string;
    public is_on_channel: boolean;
    public supplier_id?: string;
}
