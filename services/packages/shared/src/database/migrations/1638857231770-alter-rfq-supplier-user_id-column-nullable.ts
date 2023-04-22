import { MigrationInterface, QueryRunner } from 'typeorm';

export class alterRfqSupplierUserIdColumnNullable1638857231770 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rfq_supplier"
        ALTER COLUMN "user_id" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rfq_supplier"
        ALTER COLUMN "user_id" SET NOT NULL`);
    }
}
