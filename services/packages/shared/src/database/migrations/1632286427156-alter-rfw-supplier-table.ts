import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterRfwSupplierTable1632286427156 implements MigrationInterface {
    private table = 'rfq';
    private column = 'rfq_number';
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rfq_item"
        ALTER COLUMN "baseline_price" TYPE NUMERIC,
        ALTER COLUMN "baseline_price" SET NOT NULL,
        ALTER COLUMN "baseline_price" DROP DEFAULT`);

        await queryRunner.query(`ALTER TABLE "rfq_item"
        ALTER COLUMN "baseline_quantity" TYPE NUMERIC,
        ALTER COLUMN "baseline_quantity" SET NOT NULL,
        ALTER COLUMN "baseline_quantity" DROP DEFAULT`);

        await queryRunner.query(`ALTER TABLE "rfq"
        ALTER COLUMN "status" TYPE VARCHAR(40),
        ALTER COLUMN "status" DROP NOT NULL,
        ALTER COLUMN "status" SET DEFAULT 'draft'`);

        await queryRunner.query(`update rfq set status = 'draft' where status is null`);

        const hasColumn = await queryRunner.hasColumn(this.table, this.column);
        if (hasColumn) {
            return;
        }

        await queryRunner.query(` ALTER TABLE ${this.table} ADD COLUMN ${this.column} SERIAL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const hasColumn = await queryRunner.hasColumn(this.table, this.column);
        if (hasColumn) {
            await queryRunner.dropColumn(this.table, this.column);
        }
    }
}
