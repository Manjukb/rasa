import { RequestUserResponse, SettingResponse, SuccessResponse } from '../viewmodels/response';

import { ResponseViewModel } from '../viewmodels/response-viewmodel';
import { RoleService } from './role-service';
import { Setting } from '../database/models';
import { SettingRequest } from '../viewmodels/requests';
import { getRepository } from 'typeorm';
import { injectable } from 'inversify';

export interface SettingServiceContract {
    create(request: SettingRequest): Promise<ResponseViewModel<SuccessResponse>>;
    getSetting(user: RequestUserResponse, organisationId: string): Promise<ResponseViewModel<SettingResponse>>;
    getById(clientId?: string): Promise<Setting>;
    getProductParameter(organisationId: string): Promise<string[]>;
}

@injectable()
export class SettingService implements SettingServiceContract {
    public async getById(clientId?: string): Promise<Setting> {
        const query = getRepository(Setting).createQueryBuilder('setting');
        if (clientId) {
            query.where('setting.organisation_id = :clientId', { clientId });
        } else {
            query.where('setting.organisation_id is null');
        }
        const setting = await query.getOne();

        return setting;
    }

    public async create(request: SettingRequest): Promise<ResponseViewModel<SuccessResponse>> {
        const response = new ResponseViewModel<SuccessResponse>();
        const organisationId = request.organisation_id;
        const setting = await this.getById(organisationId);
        const parsedSetting = setting ? JSON.parse(JSON.stringify(setting.settings)) : {};

        const data = request.data ? { enable_email: request.data === 'true' } : {};

        Object.entries(data).forEach((value: [string, unknown]): void => {
            parsedSetting[value[0]] = value[1];
            return;
        });

        if (setting) {
            setting.organisation_id = request.organisation_id || null;
            setting.settings = parsedSetting;
            await getRepository(Setting).save(setting);
        } else {
            const newSetting = new Setting();
            newSetting.organisation_id = request.organisation_id || null;
            newSetting.settings = data;
            await getRepository(Setting).insert(newSetting);
        }

        response.data = { success: true };

        return response;
    }

    public async getSetting(
        user: RequestUserResponse,
        organisationId: string,
    ): Promise<ResponseViewModel<SettingResponse>> {
        const isSuperAdmin = new RoleService().isSuperAdmin(user);
        let clientId = user.organisation_id;

        if (isSuperAdmin && organisationId) {
            clientId = organisationId;
        }
        const settingResponse = await this.getClientSetting(clientId);

        return settingResponse;
    }

    private async getClientSetting(clientId: string): Promise<ResponseViewModel<SettingResponse>> {
        const response = new ResponseViewModel<SettingResponse>();
        const query = getRepository(Setting).createQueryBuilder('setting');
        query.where('setting.organisation_id is null or setting.organisation_id = :clientId', { clientId });

        const settings = await query.getMany();

        const data = new SettingResponse();
        settings.forEach((setting: Setting): void => {
            if (setting.organisation_id) {
                data.client_setting = setting.settings;
                return;
            }
            data.negobot_setting = setting.settings;
            return;
        });
        response.data = data;

        return response;
    }

    public async getProductParameter(organisationId: string): Promise<string[]> {
        const setting = ResponseViewModel.getData(await this.getClientSetting(organisationId), null);
        if (setting) {
            const jsonSetting = JSON.parse(JSON.stringify(setting));
            const productParameters: string[] =
                (jsonSetting.client_setting && jsonSetting.client_setting.productParameters) ??
                jsonSetting.negobot_setting.productParameters;

            return productParameters;
        }
    }
}
