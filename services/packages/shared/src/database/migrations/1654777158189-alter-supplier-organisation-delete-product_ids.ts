import { MigrationInterface, QueryRunner } from 'typeorm';

export class alterSupplierOrganisationDeleteProductIds1654777158189 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "supplier_organisation"
        DROP COLUMN "product_ids"`);
    }

    public async down(): Promise<void> {
        console.warn('no need to drop column "product_ids" again');
    }
}
