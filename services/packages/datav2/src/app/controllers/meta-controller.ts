import { Controller, Get, interfaces, Post } from 'inversify-restify-utils';

import {
    AuthMiddleware,
    BotParameterCheckResponse,
    BotSchemaResponse,
    BusinessType,
    CheckBotParameterRequest,
    CheckBotParameterValidator,
    MetaServiceContract,
    WithUserRequest,
} from '@negobot/shared/';
import { ControllerBase } from './controller-base';
import { ResponseViewModel } from '@negobot/shared/';
import { inject, injectable } from 'inversify';
import { Request } from 'restify';

@Controller('/meta')
@injectable()
export class MetaController extends ControllerBase implements interfaces.Controller {
    public constructor(@inject('MetaService') private readonly metaService: MetaServiceContract) {
        super();
    }

    @Get('/bot-schema', AuthMiddleware)
    public schema(request: WithUserRequest): ResponseViewModel<BotSchemaResponse> {
        const businessType = request.user.business_types[0];
        return businessType === BusinessType.sales ? this.metaService.salesBotSchema() : this.metaService.botSchema();
    }

    @Post('/check-bot-parameter-status')
    public async getBotAndParamsStatus(request: Request): Promise<ResponseViewModel<BotParameterCheckResponse>> {
        const validationResult = await super.validate<BotParameterCheckResponse>(request, CheckBotParameterValidator);

        if (validationResult) {
            return validationResult;
        }

        const transformedRequest = super.withOutAuthTransform<CheckBotParameterRequest>(
            request,
            CheckBotParameterRequest,
        );

        return this.metaService.getBotAndParamsStatus(transformedRequest);
    }
}
