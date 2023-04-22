import { ControllerBase } from './controller-base';
import { env, Organisation, ResponseViewModel, SuccessResponse } from '@negobot/shared/';
import { Controller, interfaces, Post } from 'inversify-restify-utils';
import { inject, injectable } from 'inversify';
import { SeedServiceContract } from '@negobot/shared/';
import { User } from '@negobot/shared/';

@Controller('/seed')
@injectable()
export class SeedController extends ControllerBase implements interfaces.Controller {
    public constructor(@inject('SeedService') private readonly seedService: SeedServiceContract) {
        super();
    }

    @Post('/super-admin')
    public async createSuperAdmin(): Promise<ResponseViewModel<User | SuccessResponse>> {
        if (env.ENVIRONMENT !== 'local') {
            return;
        }
        return this.seedService.createSuperAdmin();
    }

    @Post('/organisation')
    public async createOrganisation(): Promise<ResponseViewModel<Organisation | SuccessResponse>> {
        if (env.ENVIRONMENT !== 'local') {
            return;
        }
        return this.seedService.createOrganisation();
    }
}
