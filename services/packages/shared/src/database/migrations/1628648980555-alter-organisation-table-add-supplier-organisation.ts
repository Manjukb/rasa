import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
import { Util } from '../../helpers';

export class AlterOrganisationTableAddSupplierOrganisation1628648980555 implements MigrationInterface {
    private table = 'organisation';
    private columns = {
        supplier_organisation_id: 'supplier_organisation_id',
    };
    private searchIndex = 'organisation_supplier_organisation_id_search_index';
    private foreignKeyIndex = 'organisation_supplier_organisation_id';
    private refTable = 'organisation';
    private refColumn = 'organisation_id';

    public async up(queryRunner: QueryRunner): Promise<void> {
        const hasSOIDColumn = await queryRunner.hasColumn(this.table, this.columns.supplier_organisation_id);
        if (hasSOIDColumn) {
            return;
        }

        await queryRunner.addColumns(this.table, [
            new TableColumn({
                name: this.columns.supplier_organisation_id,
                type: 'varchar',
                length: '40',
                isNullable: true,
            }),
        ]);

        await Util.createSearchIndex(queryRunner, this.table, this.searchIndex, [
            this.columns.supplier_organisation_id,
        ]);
        await Util.createForeignKey(
            queryRunner,
            this.table,
            this.foreignKeyIndex,
            [this.columns.supplier_organisation_id],
            this.refTable,
            [this.refColumn],
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const hasSOIDColumn = await queryRunner.hasColumn(this.table, this.columns.supplier_organisation_id);
        if (!hasSOIDColumn) {
            return;
        }
        await queryRunner.dropColumn(this.table, this.columns.supplier_organisation_id);
    }
}
