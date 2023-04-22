import { MigrationInterface, QueryRunner } from 'typeorm';

export class alterMailQueueDropRfqIdUniqueKey1639645055931 implements MigrationInterface {
    private tableName = 'mail_queue';
    private columnNames = ['rfq_id'];
    public async up(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable(this.tableName);

        for (const uniqueConstraint of table.uniques) {
            for (const columnName of this.columnNames) {
                if (uniqueConstraint.columnNames.includes(columnName)) {
                    await queryRunner.dropUniqueConstraint(this.tableName, uniqueConstraint.name);
                }
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "mail_queue"
        ADD CONSTRAINT mail_queue_unique_rfq_id UNIQUE("rfq_id")`);
    }
}
