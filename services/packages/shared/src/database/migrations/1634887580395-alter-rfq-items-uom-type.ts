import { MigrationInterface, QueryRunner } from 'typeorm';

export class alterRfqItemsUomType1634887580395 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rfq_item"
        ALTER COLUMN "uom" TYPE varchar(56)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rfq_item"
        ALTER COLUMN "uom" TYPE enum`);
    }
}
