import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterParameterAddSearchIndex1623947265817 implements MigrationInterface {
    private table = 'parameter';
    private organisationIdSearchIndex = 'parameter_organisation_id';
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
