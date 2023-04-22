import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
import { Util } from '../../helpers';

export class AlterUserAddPhone1628582047494 implements MigrationInterface {
    private table = 'user';
    private columns = {
        phone: 'phone',
    };
    private indexName = 'user_phone_search_index';
    public async up(queryRunner: QueryRunner): Promise<void> {
        const hasPhoneColumn = await queryRunner.hasColumn(this.table, this.columns.phone);
        if (hasPhoneColumn) {
            return;
        }

        await queryRunner.addColumns(this.table, [
            new TableColumn({
                name: this.columns.phone,
                type: 'varchar',
                length: '16',
                isNullable: true,
            }),
        ]);

        await Util.createSearchIndex(queryRunner, this.table, this.indexName, [this.columns.phone]);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const hasPhoneColumn = await queryRunner.hasColumn(this.table, this.columns.phone);
        if (!hasPhoneColumn) {
            return;
        }
        await queryRunner.dropColumn(this.table, this.columns.phone);
    }
}
