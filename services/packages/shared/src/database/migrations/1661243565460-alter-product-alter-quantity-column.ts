import { MigrationInterface, QueryRunner } from 'typeorm';

export class alterProductAlterQuantityColumn1661243565460 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "product" ALTER COLUMN "quantity" type numeric(8,2) using cast(quantity as numeric);`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        console.warn('no need to alter column again');
    }
}
