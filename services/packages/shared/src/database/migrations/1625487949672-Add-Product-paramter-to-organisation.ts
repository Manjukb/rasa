import { MigrationInterface, getRepository } from 'typeorm';
import { Constant } from '../../helpers';
import { SettingRequest } from '../../viewmodels/requests';
import { Organisation, Setting } from '../models';

export class AddProductParamterToOrganisation1625487949672 implements MigrationInterface {
    private async getById(clientId?: string): Promise<Setting> {
        const query = getRepository(Setting).createQueryBuilder('setting');
        if (clientId) {
            query.where('setting.organisation_id = :clientId', { clientId });
        } else {
            query.where('setting.organisation_id is null');
        }
        const setting = await query.getOne();

        return setting;
    }

    public async create(request: SettingRequest): Promise<void> {
        const organisationId = request.organisation_id;
        const setting = await this.getById(organisationId);
        const parsedSetting = setting ? JSON.parse(JSON.stringify(setting.settings)) : {};
        const data = request.data ? JSON.parse(request.data) : {};

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
            newSetting.settings = parsedSetting;
            await getRepository(Setting).insert(newSetting);
        }
    }

    public async up(): Promise<void> {
        const salesOrganisations = await getRepository(Organisation)
            .createQueryBuilder('org')
            .select(['org.organisation_id', 'org.name', 'org.business_type'])
            .where(`org.business_type LIKE '%sales%'`)
            .getMany();
        const orgIds = salesOrganisations.map((salesOrganisation) => salesOrganisation.organisation_id);
        const parameters = [Constant.productParameters.price, Constant.productParameters.quantity];

        const data = JSON.stringify({ productParameters: parameters });

        await Promise.all(
            orgIds.map(
                async (orgId: string): Promise<void> => {
                    await this.create({ data, organisation_id: orgId });

                    return;
                },
            ),
        );
        await this.create({ data, organisation_id: null });
    }

    public async down(): Promise<void> {
        // nothing to do
    }
}
