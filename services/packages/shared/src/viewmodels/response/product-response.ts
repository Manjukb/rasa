import { Product, ProductParameter } from '../../database/models';
import { ProductDescription, ProductInfo } from '../../types';

export class ProductResponse {
    public id: string;
    public is_active: boolean;
    public organisation_id: string;
    public name: string;
    public tenant_id?: string;
    public product_code: string;
    public productInfo: ProductInfo;
    public created_date: Date;
    public updated_date: Date;
    public has_payment_terms: boolean;
    public is_manual_nego: boolean;

    public category_id?: string;
    public sub_category_id?: string;
    public description?: ProductDescription;
    public uom?: string;
    public price?: number;
    public currency?: string;
    public quantity?: number;
    public productParameter: ProductParameter;
    public category_name: string;
}

export class LightweightProductResponse {
    public id: string;
    public name: string;
    public category_name: string;
    public subcategory_name?: string;
    public category_id: string;
    public sub_category_id?: string;
    public uom: string;
    public price: number;
    public currency: string;

    public static fromModel(product: Product): LightweightProductResponse {
        return {
            id: product.id,
            name: product.name,
            category_name: product.product_info.category,
            subcategory_name: product.product_info.subcategory,
            uom: product.uom,
            price: product.price,
            category_id: product.category_id,
            sub_category_id: product.sub_category_id,
            currency: product.currency,
        };
    }
    public static fromModels(products: Product[]): LightweightProductResponse[] {
        return products.map((product) => LightweightProductResponse.fromModel(product));
    }
}
