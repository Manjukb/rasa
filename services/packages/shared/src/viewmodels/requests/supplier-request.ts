import { SupplierImportRequest } from './supplier-import-request';

export class SupplierRequest {
    public id?: string;
    public name: string;
    public address: string;
    public static requestFromSupplierImportRequest(request: SupplierImportRequest): SupplierRequest {
        return {
            name: request.company_name,
            address: request.company_address,
        };
    }
}
