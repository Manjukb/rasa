import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

import { Util } from '../../helpers';

export class alterBotAddUpdateByColumn1638980966034 implements MigrationInterface {
    private tableName = 'bot';
    private column = 'updated_by';

    private updatedByForeignKeyIndex = 'bot_updater';
    private userRefTable = 'user';
    private userRefColumn = 'user_id';

    public async up(queryRunner: QueryRunner): Promise<void> {
        const hasUpdatedByColumn = await queryRunner.hasColumn(this.tableName, this.column);
        if (hasUpdatedByColumn) {
            return;
        }
        await queryRunner.addColumn(
            this.tableName,
            new TableColumn({
                name: this.column,
                type: 'varchar',
                isNullable: true,
                length: '40',
            }),
        );

        await Util.createForeignKey(
            queryRunner,
            this.tableName,
            this.updatedByForeignKeyIndex,
            [this.column],
            this.userRefTable,
            [this.userRefColumn],
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const hasUpdatedByColumn = await queryRunner.hasColumn(this.tableName, this.column);
        if (hasUpdatedByColumn) {
            await queryRunner.dropColumn(this.tableName, this.column);
        }
    }
}
