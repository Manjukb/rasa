import { BuyerParameters } from '../../types/parameter';
import { ParameterConfiguration } from '../../types/parameter-configuration';
import { ProductParameter } from '../../database/models';
import { ProductRequest } from './product-request';

export class ProductParameterRequest {
    public id: string;
    public organisation_id: string;
    public product: ProductRequest;
    public saving_parameters: BuyerParameters;
    public parameter: ParameterConfiguration[];
    public step_count: BuyerParameters;

    public static toModel(me: ProductParameterRequest): ProductParameter {
        const productParam = new ProductParameter();
        if (me.id) {
            productParam.id = me.id;
        }
        productParam.organisation_id = me.organisation_id;
        productParam.parameter = me.parameter;
        productParam.saving_parameters = me.saving_parameters;
        productParam.step_count = me.step_count;
        productParam.product_id = me.product?.id;

        return productParam;
    }
}
