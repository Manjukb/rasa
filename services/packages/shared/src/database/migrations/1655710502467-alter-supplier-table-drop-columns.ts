import { MigrationInterface, QueryRunner } from 'typeorm';

export class alterSupplierTableDropColumns1655710502467 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "supplier"
        DROP COLUMN "category_ids"`);
    }

    public async down(): Promise<void> {
        console.warn('no need to drop column "category_ids" again');
    }
}
