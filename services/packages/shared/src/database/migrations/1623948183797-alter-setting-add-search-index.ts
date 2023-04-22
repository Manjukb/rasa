import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterSettingAddSearchIndex1623948183797 implements MigrationInterface {
    private table = 'setting';
    private organisationIdSearchIndex = 'setting_organisation_id';
    private organisationIdColum = 'organisation_id';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createIndex(this.table, {
            name: this.organisationIdSearchIndex,
            columnNames: [this.organisationIdColum],
            clone: undefined,
            isFulltext: true,
            isSpatial: false,
            isUnique: false,
            where: '',
        });
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropIndex(this.table, this.organisationIdSearchIndex);
    }
}
