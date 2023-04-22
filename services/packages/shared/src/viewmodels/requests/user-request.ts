import { ICreatedBy } from '../../interfaces';

export class UserRequest implements ICreatedBy {
    public organisation_id: string;
    public authority: string;
    public role: string;
    public name: string;
    public email: string;

    public business_types: string[];
    public created_by: string;
    public updated_by: string;
}

export class UpdateUserRequest implements ICreatedBy {
    public id: string;
    public name: string;
    public email: string;
    public business_types: string[];

    public created_by: string;
    public updated_by: string;
}
