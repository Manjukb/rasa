import { Supplier, SupplierCategoryProduct, User } from '../../database/models';

import { SupplierLightWeightResponse } from './supplier-response';

export class OrganisationSupplierResponse {
    public id: string;
    public name: string;
    public address: string;
    public status: boolean;
    public created_date: Date;
    public category_ids?: string[];
    public sub_category_ids?: string[];
    public product_ids?: string[];
    public suppliers: SupplierLightWeightResponse[];

    public static fromModel(
        supplier: Supplier,
        suppliers: User[],
        supplierCategoryProduct?: SupplierCategoryProduct,
    ): OrganisationSupplierResponse {
        const lightWeightSuppliers = suppliers.map((s) => SupplierLightWeightResponse.fromModel(s));
        const { id, name, address, is_active: status, created_date } = supplier;
        return {
            id,
            name,
            address,
            status,
            created_date,
            category_ids: supplierCategoryProduct ? supplierCategoryProduct.category_ids : null,
            sub_category_ids: supplierCategoryProduct ? supplierCategoryProduct.sub_category_ids : null,
            product_ids: supplierCategoryProduct ? supplierCategoryProduct.product_ids : null,
            suppliers: lightWeightSuppliers,
        };
    }
}
