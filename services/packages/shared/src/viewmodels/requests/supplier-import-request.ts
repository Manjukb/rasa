import { ICreatedBy } from '../../interfaces';
import { SupplierImportRow } from '../../types';

export class SupplierImportRequest implements ICreatedBy {
    public id?: string;
    public company_name: string;
    public company_address?: string;
    public organisation_id: string;
    public name: string;
    public email: string;
    public phone: string;
    public created_by: string;
    public updated_by: string;

    public static toRequest(request: SupplierImportRow, userId: string, organisationId: string): SupplierImportRequest {
        return {
            // supplier details
            id: request.id.trim(),
            name: request.supplier_name.trim(),
            email: request.supplier_email.trim(),
            phone: request.supplier_phone.trim(),

            // company details
            company_address: request.company_address.trim(),
            company_name: request.company_name.trim(),
            organisation_id: organisationId,

            // user details
            created_by: userId,
            updated_by: userId,
        };
    }
}
