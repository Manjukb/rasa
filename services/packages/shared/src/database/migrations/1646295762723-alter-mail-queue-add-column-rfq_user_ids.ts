import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class alterMailQueueAddColumnRfqUserIds1646295762723 implements MigrationInterface {
    private tableName = 'mail_queue';
    private column = 'user_ids';

    public async up(queryRunner: QueryRunner): Promise<void> {
        const hasUserIdsColumn = await queryRunner.hasColumn(this.tableName, this.column);
        if (hasUserIdsColumn) {
            return;
        }

        await queryRunner.addColumn(
            this.tableName,
            new TableColumn({
                name: this.column,
                type: 'jsonb',
                isNullable: true,
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const hasUserIdsColumn = await queryRunner.hasColumn(this.tableName, this.column);
        if (hasUserIdsColumn) {
            await queryRunner.dropColumn(this.tableName, this.column);
        }
    }
}
