import { OrganisationSettings } from '../../types/organisation-info';

export class OrganisationLightWeightResponse {
    public id: string;
    public organisation_id: string;
    public name: string;
    public client_type: string;
    public organisation_settings: OrganisationSettings;
}
