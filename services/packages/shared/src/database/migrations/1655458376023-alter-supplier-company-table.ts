import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

import { Util } from '../..';

export class alterSupplierCompanyTable1655458376023 implements MigrationInterface {
    private tableName = 'supplier';

    // search index
    private supplierCompanyIdSearchIndex = 'supplier_company_id_search_index';

    // foreign key index
    private supplierCompanyForeignKeyIndex = 'supplier_company_index';

    // ref tables
    private supplierCompanyRefTable = 'supplier_company';

    //ref columns
    private supplierCompanyRefColumn = 'id';

    private column = 'supplier_company_id';

    public async up(queryRunner: QueryRunner): Promise<void> {
        const hasSupplierCompanyIdColumn = await queryRunner.hasColumn(this.tableName, this.column);
        if (hasSupplierCompanyIdColumn) {
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

        await Util.createSearchIndex(queryRunner, this.tableName, this.supplierCompanyIdSearchIndex, [this.column]);

        await Util.createForeignKey(
            queryRunner,
            this.tableName,
            this.supplierCompanyForeignKeyIndex,
            [this.column],
            this.supplierCompanyRefTable,
            [this.supplierCompanyRefColumn],
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const hasSupplierCompanyIdColumn = await queryRunner.hasColumn(this.tableName, this.column);
        if (hasSupplierCompanyIdColumn) {
            await queryRunner.dropColumn(this.tableName, this.column);
        }
    }
}
