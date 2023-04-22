import { Product } from '../database/models';
import { ProductParameter } from '../database/models';
import { ProductResponse } from '../viewmodels/response';

export class ProductResponseTransformer {
    public static transform(product: Product, param?: ProductParameter): ProductResponse {
        const productResponse = new ProductResponse();
        productResponse.id = product.id;
        productResponse.name = product.name;
        productResponse.is_active = product.is_active ? true : false;

        productResponse.product_code = product.product_code;
        productResponse.organisation_id = product.organisation_id;
        productResponse.tenant_id = product.tenant_id;
        productResponse.created_date = product.created_date;
        productResponse.updated_date = product.updated_date;
        productResponse.productInfo = product.product_info;
        productResponse.quantity = product.quantity;
        productResponse.has_payment_terms = product.has_payment_terms ?? false;

        productResponse.category_id = product.category_id;
        productResponse.category_name = (product.category || {}).name;
        productResponse.sub_category_id = product.sub_category_id;
        productResponse.description = product.description;
        productResponse.is_manual_nego = product.is_manual_nego;

        productResponse.uom = product.uom ?? null;
        productResponse.price = product.price;
        productResponse.currency = product.currency ?? null;
        productResponse.productParameter = param ?? null;

        return productResponse;
    }

    public static transformList(products: Product[]): ProductResponse[] {
        return products.map((product) => this.transform(product));
    }
}
