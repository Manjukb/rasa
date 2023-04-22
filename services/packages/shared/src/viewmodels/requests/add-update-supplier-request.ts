import { ICreatedBy } from '../../interfaces';

export class AddUpdateSupplierRequest implements ICreatedBy {
    public id?: string;
    public company_name: string;
    public company_address?: string;
    public organisation_id: string;
    public name: string;
    public email: string;
    public phone: string;
    public category_ids?: string[];
    public sub_category_ids?: string[];
    public product_ids?: string[];
    public created_by: string;
    public updated_by: string;

    public static toRequest(request: any, userId: string, organisationId: string): AddUpdateSupplierRequest {
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

            // other details
            category_ids: request.category_ids ? request.category_ids : null,
            sub_category_ids: request.sub_category_ids ? request.sub_category_ids : null,
            product_ids: request.product_ids ? request.product_ids : null,

            // user details
            created_by: userId,
            updated_by: userId,
        };
    }
}
