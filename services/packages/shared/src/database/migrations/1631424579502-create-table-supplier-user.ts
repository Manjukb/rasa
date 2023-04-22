import { MigrationInterface, QueryRunner, Table } from 'typeorm';
import { Util } from '../..';

export class CreateTableSupplierUser1631424579502 implements MigrationInterface {
    private tableName = 'supplier_user';

    // search index
    private supplierIdSearchIndex = 'supplier_user_supplier_id_search_index';
    private userIdSearchIndex = 'supplier_user_user_id_search_index';

    // foreign key index
    private supplierIdForeignKeyIndex = 'supplier_user_supplier_id_f_key';
    private userIdForeignKeyIndex = 'supplier_user_user_id_f_key';

    // ref tables
    private supplierRefTable = 'supplier';
    private userRefTable = 'user';

    //ref columns
    private supplierIdRefColumn = 'id';
    private userIdRefColumn = 'user_id';

    private columns = {
        id: 'id',
        supplierId: 'supplier_id',
        userId: 'user_id',
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
                        name: this.columns.supplierId,
                        type: 'varchar',
                        isNullable: false,
                        length: '40',
                    },
                    {
                        name: this.columns.userId,
                        type: 'varchar',
                        isNullable: false,
                        length: '40',
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

        // adding search index
        await Util.createSearchIndex(queryRunner, this.tableName, this.supplierIdSearchIndex, [
            this.columns.supplierId,
        ]);
        await Util.createSearchIndex(queryRunner, this.tableName, this.userIdSearchIndex, [this.columns.userId]);

        // adding foreign key index
        await Util.createForeignKey(
            queryRunner,
            this.tableName,
            this.supplierIdForeignKeyIndex,
            [this.columns.supplierId],
            this.supplierRefTable,
            [this.supplierIdRefColumn],
        );

        await Util.createForeignKey(
            queryRunner,
            this.tableName,
            this.userIdForeignKeyIndex,
            [this.columns.userId],
            this.userRefTable,
            [this.userIdRefColumn],
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
