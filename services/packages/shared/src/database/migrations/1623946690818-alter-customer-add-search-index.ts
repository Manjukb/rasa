import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterCustomerAddSearchIndex1623946690818 implements MigrationInterface {
    private table = 'customer';
    private identifierSearchIndex = 'customer_identifier';
    private identifierColum = 'identifier';
    private organisationIdSearchIndex = 'customer_organisation_id';
    private organisationIdColum = 'organisation_id';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createIndex(this.table, {
            name: this.identifierSearchIndex,
            columnNames: [this.identifierColum],
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
        await queryRunner.dropIndex(this.table, this.identifierSearchIndex);
        await queryRunner.dropIndex(this.table, this.organisationIdSearchIndex);
    }
}
