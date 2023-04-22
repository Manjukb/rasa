import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameTableToBot1630646206196 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('alter table negotiation_evaluation_metric rename to bot');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('alter table bot rename to negotiation_evaluation_metric rename');
    }
}
