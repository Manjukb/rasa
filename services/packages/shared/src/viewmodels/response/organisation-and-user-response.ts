import { Organisation, User } from '../../database/models';

export class OrganisationAndUserResponse {
    public user: User;
    public organisation: Organisation;
}
