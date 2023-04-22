import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
import { Util } from '../..';

export class AlterUserTableMakeOrgIdNullable1631405503280 implements MigrationInterface {
    private tableName = 'user';
    private supplierIdColumn = 'supplier_id';

    // search index
    private supplierIdSearchIndex = 'user_supplier_id_search_index';

    // foreign key index
    private supplierIdForeignKeyIndex = 'user_supplier_id_f_key';

    // ref tables
    private supplierRefTable = 'supplier';
    //ref columns
    private supplierRefColumn = 'id';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user"
        ALTER COLUMN "organisation_id" TYPE VARCHAR(40),
        ALTER COLUMN "organisation_id" DROP NOT NULL,
        ALTER COLUMN "organisation_id" DROP DEFAULT`);

        const hasSupplierIdColumn = await queryRunner.hasColumn(this.tableName, this.supplierIdColumn);
        if (hasSupplierIdColumn) {
            return;
        }
        await queryRunner.addColumn(
            this.tableName,
            new TableColumn({
                name: this.supplierIdColumn,
                type: 'varchar',
                length: '40',
                isNullable: true,
            }),
        );

        await Util.createSearchIndex(queryRunner, this.tableName, this.supplierIdSearchIndex, [this.supplierIdColumn]);

        await Util.createForeignKey(
            queryRunner,
            this.tableName,
            this.supplierIdForeignKeyIndex,
            [this.supplierIdColumn],
            this.supplierRefTable,
            [this.supplierRefColumn],
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
        ALTER TABLE "user"
            ALTER COLUMN "organisation_id" TYPE VARCHAR(40),
            ALTER COLUMN "organisation_id" SET NOT NULL,
            ALTER COLUMN "organisation_id" DROP DEFAULT`);

        const hasSupplierIdColumn = await queryRunner.hasColumn(this.tableName, this.supplierIdColumn);
        if (hasSupplierIdColumn) {
            await queryRunner.dropColumn(this.tableName, this.supplierIdColumn);
        }
    }
}
