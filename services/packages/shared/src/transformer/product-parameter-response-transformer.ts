import { BotResponse, ProductParameterResponse, ProductResponse } from '../viewmodels/response';

import { Constant } from '../helpers';
import { ProductParameter } from '../database/models';

export class ProductParameterResponseTransformer {
    public static transform(parameter: ProductParameter): ProductParameterResponse {
        const parameterResponse = new ProductParameterResponse();
        parameterResponse.id = parameter.id.toString();
        parameterResponse.created_date = parameter.created_date;
        parameterResponse.updated_date = parameter.updated_date;
        parameterResponse.parameter = parameter.parameter;
        parameterResponse.saving_parameters = parameter.saving_parameters;
        parameterResponse.step_count = parameter.step_count;
        parameterResponse.organisation_id = parameter.organisation_id;
        parameterResponse.product_id = parameter.product_id;

        return parameterResponse;
    }

    public static transformList(
        params: ProductParameter[],
        products: ProductResponse[],
        bots?: BotResponse[],
    ): ProductParameterResponse[] {
        return params.map((param) => {
            const paramResponse = this.transform(param);
            const product = products.find((p) => p.id === param.product_id);
            paramResponse.product_code = (product || {}).product_code;
            paramResponse.category_id = (product || {}).category_id;
            paramResponse.is_manual_nego = (product || {}).is_manual_nego;
            paramResponse.quantity = (product || {}).quantity;
            paramResponse.sub_category_id = (product || {}).sub_category_id;
            paramResponse.uom = (product || {}).uom;
            paramResponse.currency = (product || {}).currency;
            paramResponse.price = (product || {}).price;
            paramResponse.category_name = (product || {}).category_name;

            paramResponse.bot = bots.find(
                (t) =>
                    t.categories.findIndex((c) => c.id === product.category_id) >= 0 &&
                    t.tenant_id === product.tenant_id,
            );
            if (!paramResponse.bot) {
                paramResponse.bot = bots.find((t) => t.tenant_id === product.tenant_id);
            }
            const org_step = paramResponse.bot.organisation?.organisation_settings;
            paramResponse.step_count = (product || {}).is_manual_nego
                ? param.step_count || {
                      price: org_step?.step_count?.price || Constant.StepCount.price,
                      quantity: org_step?.step_count?.quantity || Constant.StepCount.quantity,
                  }
                : {
                      price: org_step?.step_count?.price || Constant.StepCount.price,
                      quantity: org_step?.step_count?.quantity || Constant.StepCount.quantity,
                  };

            paramResponse.product_name = ((product || {}).productInfo || {}).name || paramResponse.product_code;
            return paramResponse;
        });
    }
}
