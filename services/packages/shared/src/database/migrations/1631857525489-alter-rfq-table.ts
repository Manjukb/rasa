import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterRfqTable1631857525489 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rfq"
        ALTER COLUMN "parameter" TYPE JSONB,
        ALTER COLUMN "parameter" DROP NOT NULL,
        ALTER COLUMN "parameter" DROP DEFAULT`);

        await queryRunner.query(`ALTER TABLE "rfq"
        ALTER COLUMN "negotiation_process" TYPE JSONB,
        ALTER COLUMN "negotiation_process" DROP NOT NULL,
        ALTER COLUMN "negotiation_process" DROP DEFAULT`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rfq"
        ALTER COLUMN "parameter" TYPE JSONB,
        ALTER COLUMN "parameter" SET NOT NULL,
        ALTER COLUMN "parameter" DROP DEFAULT`);

        await queryRunner.query(`ALTER TABLE "rfq"
        ALTER COLUMN "negotiation_process" TYPE JSONB,
        ALTER COLUMN "negotiation_process" SET NOT NULL,
        ALTER COLUMN "negotiation_process" DROP DEFAULT`);
    }
}
