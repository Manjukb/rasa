import { MigrationInterface, QueryRunner } from 'typeorm';

export class alterRfqItemSetCreatedByUpdatedByNullable1658836578346 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rfq_item" ALTER COLUMN "created_by" DROP NOT NULL;`);
        await queryRunner.query(`ALTER TABLE "rfq_item" ALTER COLUMN "updated_by" DROP NOT NULL;`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        console.warn('no need to drop null-constraints again');
    }
}
