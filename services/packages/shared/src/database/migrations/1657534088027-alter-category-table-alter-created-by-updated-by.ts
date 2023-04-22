import { MigrationInterface, QueryRunner } from 'typeorm';

export class alterCategoryTableAlterCreatedByUpdatedBy1657534088027 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "category" ALTER COLUMN "created_by" DROP NOT NULL;`);
        await queryRunner.query(`ALTER TABLE "category" ALTER COLUMN "updated_by" DROP NOT NULL;`);
    }

    public async down(): Promise<void> {
        console.warn('no need to drop null-constraints again');
    }
}
