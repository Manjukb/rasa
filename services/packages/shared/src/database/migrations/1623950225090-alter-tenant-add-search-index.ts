import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterTenantAddSearchIndex1623950225090 implements MigrationInterface {
    private table = 'tenant';
    private organisationIdSearchIndex = 'tenant_organisation_id';
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
