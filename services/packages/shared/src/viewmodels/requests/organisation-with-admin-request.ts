import { ICreatedBy } from '../../interfaces';

export class OrganisationWithAdminRequest implements ICreatedBy {
    public name: string;
    public client_type: string;
    public timezone: string;
    public business_types: string[];
    public admin: {
        name: string;
        email: string;
    };
    public domains: string[];

    public created_by: string;
    public updated_by: string;
}
