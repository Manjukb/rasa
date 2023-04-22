import { Parameter } from './parameter';
import { ParameterConfiguration } from './parameter-configuration';
import { ProductResponse } from '../viewmodels/response';
import { TenantResponse } from '../viewmodels/response/tenant-response';
import { TenantUser } from '../database/models';

export type BotProductAndParameter = {
    product: ProductResponse;
    parameters: ParameterConfiguration[];
    botParameter: Parameter;
    clientMessages?: Record<string, string>;
};

export type BotProductAndParameterWithTenantUsers = BotProductAndParameter & {
    tenantUsers?: TenantUser[];
    tenant?: TenantResponse;
};
