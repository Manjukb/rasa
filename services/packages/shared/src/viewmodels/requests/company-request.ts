import { ICreatedBy } from '../../interfaces';
import { SupplierImportRequest } from './supplier-import-request';

export class CompanyRequest implements ICreatedBy {
    public id?: string;
    public name: string;
    public address: string;
    public organisation_id: string;
    public created_by: string;
    public updated_by: string;

    public static requestFromSupplierImportRequest(request: SupplierImportRequest): CompanyRequest {
        return {
            // supplier details
            name: request.company_name,
            address: request.company_address,
            organisation_id: request.organisation_id,

            // user details
            created_by: request.created_by,
            updated_by: request.updated_by,
        };
    }
}
