import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterProductAddSearchIndex1623946968620 implements MigrationInterface {
    private table = 'product';
    private organisationIdSearchIndex = 'product_organisation_id';
    private organisationIdColum = 'organisation_id';
    private productCodeSearchIndex = 'product_product_code';
    private productCodeColum = 'product_code';

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

        await queryRunner.createIndex(this.table, {
            name: this.productCodeSearchIndex,
            columnNames: [this.productCodeColum],
            clone: undefined,
            isFulltext: true,
            isSpatial: false,
            isUnique: false,
            where: '',
        });
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropIndex(this.table, this.organisationIdSearchIndex);
        await queryRunner.dropIndex(this.table, this.productCodeSearchIndex);
    }
}
