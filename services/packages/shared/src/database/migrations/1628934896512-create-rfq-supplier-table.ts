import { MigrationInterface, QueryRunner, Table } from 'typeorm';
import { Util } from '../../helpers';

export class CreateRfqSupplierTable1628934896512 implements MigrationInterface {
    private tableName = 'rfq_supplier';

    // search index
    private rfqIdSearchIndex = 'rfq_supplier_winner_search_index';
    private userIdSearchIndex = 'rfq_supplier_status_search_index';

    // foreign key index
    private rfqIdForeignKeyIndex = 'rfq_supplier_rfq_id';
    private userIdForeignKeyIndex = 'rfq_supplier_user_id';

    // ref tables
    private userRefTable = 'user';
    private rfqRefTable = 'rfq';

    //ref columns
    private userRefColumn = 'user_id';
    private rfqRefColumn = 'id';

    private columns = {
        id: 'id',
        rfq_id: 'rfq_id',
        user_id: 'user_id',
        isMailSent: 'is_mail_sent',
        createdDate: 'created_date',
        updatedDate: 'updated_date',
    };

    public async up(queryRunner: QueryRunner): Promise<void> {
        const hasCategoryTable = await queryRunner.hasTable(this.tableName);
        if (hasCategoryTable) {
            return;
        }

        await queryRunner.createTable(
            new Table({
                name: this.tableName,
                columns: [
                    {
                        name: this.columns.id,
                        type: 'varchar',
                        isPrimary: true,
                        length: '40',
                    },
                    {
                        name: this.columns.rfq_id,
                        type: 'varchar',
                        isNullable: false,
                        length: '40',
                    },
                    {
                        name: this.columns.user_id,
                        type: 'varchar',
                        isNullable: false,
                        length: '40',
                    },
                    {
                        name: this.columns.isMailSent,
                        type: 'boolean',
                        isNullable: false,
                        default: false,
                    },
                    {
                        name: this.columns.createdDate,
                        type: 'timestamp',
                        default: 'now()',
                    },
                    {
                        name: this.columns.updatedDate,
                        type: 'timestamp',
                        default: 'now()',
                    },
                ],
            }),
        );

        await Util.createSearchIndex(queryRunner, this.tableName, this.rfqIdSearchIndex, [this.columns.rfq_id]);
        await Util.createSearchIndex(queryRunner, this.tableName, this.userIdSearchIndex, [this.columns.user_id]);

        await Util.createForeignKey(
            queryRunner,
            this.tableName,
            this.rfqIdForeignKeyIndex,
            [this.columns.rfq_id],
            this.rfqRefTable,
            [this.rfqRefColumn],
        );

        await Util.createForeignKey(
            queryRunner,
            this.tableName,
            this.userIdForeignKeyIndex,
            [this.columns.user_id],
            this.userRefTable,
            [this.userRefColumn],
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const hasCategoryTable = await queryRunner.hasTable(this.tableName);
        if (!hasCategoryTable) {
            return;
        }
        await queryRunner.dropTable(this.tableName);
    }
}
