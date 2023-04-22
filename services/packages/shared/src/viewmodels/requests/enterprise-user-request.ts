import { ICreatedBy } from '../../interfaces';

export class EnterpriseUserRequest implements ICreatedBy {
    public organisation_id: string;
    public organisation_info: {
        name: string;
        status: string;
    };
    public client_type: string;
    public business_types: string[];
    public created_by: string;
    public updated_by: string;
}
