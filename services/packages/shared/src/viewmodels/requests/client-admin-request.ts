import { ICreatedBy } from '../../interfaces';

export class ClientAdminRequest implements ICreatedBy {
    public user_id: string;
    public organisation_id: string;
    public authority: string;
    public password_hash: string;
    public name: string;
    public email: string;
    public user_info: {
        name: string;
        email: string;
        authority: string;
    };
    public business_types: string[];
    public created_by: string;
    public updated_by: string;
}
