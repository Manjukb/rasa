export class DecodedTokenResponse {
    public user_id: string;
    public exp: number;
    public type: string;
    public role: string;
    public negobot: {
        user_id: string;
        organisation_id: string;
        authority: string;
    };
    public organisation_id: string;
    public tenant_id: string;
}
