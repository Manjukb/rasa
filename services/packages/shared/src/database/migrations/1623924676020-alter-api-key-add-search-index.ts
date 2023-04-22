import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterApiKeyAddSearchIndex1623924676020 implements MigrationInterface {
    private table = 'api_key';
    private apiKeySearchIndex = 'api_key_key';
    private apiKeyColum = 'api_key';
    private organisationIdSearchIndex = 'api_key_organisation_id';
    private organisationIdColum = 'organisation_id';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createIndex(this.table, {
            name: this.apiKeySearchIndex,
            columnNames: [this.apiKeyColum],
            clone: undefined,
            isFulltext: true,
            isSpatial: false,
            isUnique: false,
            where: '',
        });

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
        await queryRunner.dropIndex(this.table, this.apiKeySearchIndex);
        await queryRunner.dropIndex(this.table, this.organisationIdSearchIndex);
    }
}
