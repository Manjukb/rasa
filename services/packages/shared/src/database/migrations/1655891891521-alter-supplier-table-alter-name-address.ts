import { MigrationInterface, QueryRunner } from 'typeorm';

export class alterSupplierTableAlterNameAddress1655891891521 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "supplier" ALTER COLUMN "name" DROP NOT NULL;`);
        await queryRunner.query(`ALTER TABLE "supplier" ALTER COLUMN "address" DROP NOT NULL;`);
    }

    public async down(): Promise<void> {
        console.warn('no need to drop null-constraints again');
    }
}
