import { ICreatedBy } from '../../interfaces';

export class UpdateOrganisationRequest implements ICreatedBy {
    public name: string;
    public timezone: string;
    public business_types: string[];
    public domains: string[];

    public created_by: string;
    public updated_by: string;
}
