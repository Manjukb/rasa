import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropUnusedTables1630733658149 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('drop table if exists alembic_version, payee, brand');
        await queryRunner.query('drop table if exists epd_negotiation_session, epd_parameter');
    }

    public async down(): Promise<void> {
        console.warn('upping tables is not supported.');
    }
}
