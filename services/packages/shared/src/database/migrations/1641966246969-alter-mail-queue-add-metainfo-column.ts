import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class alterMailQueueAddMetainfoColumn1641966246969 implements MigrationInterface {
    private tableName = 'mail_queue';
    private column = 'meta_info';
    public async up(queryRunner: QueryRunner): Promise<void> {
        const hasMetaInfoColumn = await queryRunner.hasColumn(this.tableName, this.column);
        if (hasMetaInfoColumn) {
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
        const hasMetaInfoColumn = await queryRunner.hasColumn(this.tableName, this.column);
        if (hasMetaInfoColumn) {
            await queryRunner.dropColumn(this.tableName, this.column);
        }
    }
}
