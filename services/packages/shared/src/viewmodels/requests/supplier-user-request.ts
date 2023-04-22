import { SupplierImportRequest } from './supplier-import-request';

export class SupplierUserRequest {
    public id?: string;
    public name: string;
    public email: string;
    public phone: string;

    public static requestFormSupplierImportRequest(request: SupplierImportRequest): SupplierUserRequest {
        return {
            // supplier details
            name: request.name,
            email: request.email,
            phone: request.phone,
        };
    }
}
