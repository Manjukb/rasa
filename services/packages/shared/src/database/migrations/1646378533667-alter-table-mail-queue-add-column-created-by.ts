import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class alterTableMailQueueAddColumnCreatedBy1646378533667 implements MigrationInterface {
    private tableName = 'mail_queue';
    private column = 'created_by';

    public async up(queryRunner: QueryRunner): Promise<void> {
        const hasCreatedByColumn = await queryRunner.hasColumn(this.tableName, this.column);
        if (hasCreatedByColumn) {
            return;
        }

        await queryRunner.addColumn(
            this.tableName,
            new TableColumn({
                name: this.column,
                type: 'json',
                isNullable: true,
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const hasCreatedByColumn = await queryRunner.hasColumn(this.tableName, this.column);
        if (hasCreatedByColumn) {
            await queryRunner.dropColumn(this.tableName, this.column);
        }
    }
}
