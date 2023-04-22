import { Controller, interfaces, Post } from 'inversify-restify-utils';
import {
    AuthMiddleware,
    CheckRoleMiddleware,
    EmbedAuthenticationResponse,
    EmbedServiceContract,
    HandshakeRequest,
    HandShakeValidator,
    ProductParameterServiceContract,
    Roles,
    SuccessResponse,
    WithUserRequest,
} from '@negobot/shared/';

import { ControllerBase } from './controller-base';
import { Request, Response } from 'restify';
import { ResponseViewModel } from '@negobot/shared/';
import { injectable, inject } from 'inversify';

@Controller('/embed')
@injectable()
export class EmbedController extends ControllerBase implements interfaces.Controller {
    public constructor(
        @inject('EmbedService') private readonly embedService: EmbedServiceContract,
        @inject('ProductParameterService') private readonly productParameterService: ProductParameterServiceContract,
    ) {
        super();
    }

    @Post('/')
    public async handShake(
        request: Request,
        response: Response,
    ): Promise<ResponseViewModel<EmbedAuthenticationResponse>> {
        const date = new Date();

        const validationResult = await super.validate<EmbedAuthenticationResponse>(request, HandShakeValidator);

        if (validationResult) {
            const error = validationResult.errors[0];

            return response.send(401, error);
        }
        const handshakeRequest = super.withOutAuthTransform<HandshakeRequest>(request, HandshakeRequest);
        const result = await this.embedService.handshake(handshakeRequest);
        const date2 = new Date();
        const diff = Math.abs(date2.getTime() - date.getTime());

        if (false) {
            request.log.info({
                text: 'logging embed request',
                diff,
                result: result,
                header: request.headers,
                payload: request.body,
                params: request.params,
                query: request.query,
                url: request.url,
            });
        }

        return result;
    }

    @Post(
        '/update-product-category',
        AuthMiddleware,
        CheckRoleMiddleware([Roles.enterprise_admin, Roles.enterprise_user, Roles.tenant_admin, Roles.tenant_user]),
    )
    public async updateProductCategory(request: WithUserRequest): Promise<ResponseViewModel<SuccessResponse>> {
        const { organisation_id: organisationId, tenant_id: tenantId } = request.user;
        const businessType = request.user.business_types[0];
        const { productList } = request.body;
        await this.productParameterService.updateProductCategory(productList, organisationId, businessType, tenantId);
        return ResponseViewModel.withSuccess();
    }
}
