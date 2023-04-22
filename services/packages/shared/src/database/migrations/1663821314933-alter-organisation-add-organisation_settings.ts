import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class alterOrganisationAddOrganisationSettings1663821314933 implements MigrationInterface {
    private tableName = 'organisation';

    private columns = {
        organisationSettings: 'organisation_settings',
    };

    public async up(queryRunner: QueryRunner): Promise<void> {
        const hasIsOrganisationSettingsColumn = await queryRunner.hasColumn(
            this.tableName,
            this.columns.organisationSettings,
        );
        if (hasIsOrganisationSettingsColumn) {
            return;
        }
        await queryRunner.addColumn(
            this.tableName,
            new TableColumn({
                name: this.columns.organisationSettings,
                type: 'json',
                isNullable: true,
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const hasIsOrganisationSettingsColumn = await queryRunner.hasColumn(
            this.tableName,
            this.columns.organisationSettings,
        );
        if (hasIsOrganisationSettingsColumn) {
            await queryRunner.dropColumn(this.tableName, this.columns.organisationSettings);
        }
    }
}
