import { CategorySet, ProductRow } from '../../types';
import { ProductDescription, ProductInfo } from '../../types/';

import { Product } from '../../database/models';

export class ProductRequest {
    public id: string;
    public product_code: string;
    public product_info: ProductInfo;
    public organisation_id: string;
    public tenant_id?: string;

    public uom: string;
    public name: string;
    public category_id?: string;
    public sub_category_id?: string;
    public price: number;
    public quantity?: number;
    public currency: string;
    public description?: ProductDescription;

    public static toModel(me: ProductRequest): Product {
        const product = new Product();
        if (me.id) {
            product.id = me.id;
        }
        Object.assign(product, me);
        product.organisation_id = me.organisation_id;
        me.tenant_id && (product.tenant_id = me.tenant_id);
        product.product_code = me.product_code;
        product.product_info = {};

        me.product_info.name && (product.product_info.name = me.product_info.name);
        me.product_info.category && (product.product_info.category = me.product_info.category);
        me.product_info.subcategory && (product.product_info.subcategory = me.product_info.subcategory);
        me.product_info.imageUrl && (product.product_info.imageUrl = me.product_info.imageUrl);
        me.price && (product.price = me.price);
        me.quantity && (product.quantity = me.quantity);
        me.currency && (product.currency = me.currency);
        me.uom && (product.uom = me.uom);

        return product;
    }

    public static productRowToModel(
        row: ProductRow,
        categorySet: CategorySet,
        organisationId: string,
        tenantId?: string,
    ): ProductRequest {
        const request = new ProductRequest();
        if (row.id) {
            request.id = row.id;
        }
        request.organisation_id = organisationId;
        tenantId && (request.tenant_id = tenantId);
        request.product_code = row.product_code;
        request.product_info = {};
        row.name && (request.product_info.name = row.name);

        if (row.category) {
            const category = categorySet[row.category.toLowerCase()];
            if (category) {
                request.category_id = category[0].id;
                if (row.subcategory) {
                    const subCategory = category.find((c) => c.child_name === row.subcategory.toLowerCase());
                    subCategory && (request.sub_category_id = subCategory.child_id);
                }
            }
        }
        row.category && (request.product_info.category = row.category);
        row.subcategory && (request.product_info.subcategory = row.subcategory);

        request.uom = row.uom ?? null;
        request.name = row.name;
        request.price = Number(row.price) ?? 0;
        request.quantity = Number(row.quantity) ?? null;
        request.currency = row.currency ?? null;
        request.product_code = row.code || row.product_code;
        request.description = { description_1: row.description_1, description_2: row.description_2 };

        return request;
    }
}
