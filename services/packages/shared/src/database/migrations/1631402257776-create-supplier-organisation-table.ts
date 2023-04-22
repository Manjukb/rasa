import { MigrationInterface, QueryRunner, Table } from 'typeorm';
import { Util } from '../..';

export class CreateSupplierOrganisationTable1631402257776 implements MigrationInterface {
    private tableName = 'supplier_organisation';

    // search index
    private supplierIdSearchIndex = 'supplier_organisation_supplier_id_search_index';
    private organisationIdSearchIndex = 'supplier_organisation_organisation_id_search_index';

    // foreign key index
    private supplierIdForeignKeyIndex = 'supplier_organisation_supplier_id_f_key';
    private organisationIdForeignKeyIndex = 'supplier_organisation_organisation_id_f_key';

    // ref tables
    private supplierRefTable = 'supplier';
    private organisationRefTable = 'organisation';

    //ref columns
    private supplierIdRefColumn = 'id';
    private organisationIdRefColumn = 'organisation_id';

    private columns = {
        id: 'id',
        supplierId: 'supplier_id',
        organisationId: 'organisation_id',
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
                        name: this.columns.organisationId,
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
        await Util.createSearchIndex(queryRunner, this.tableName, this.organisationIdSearchIndex, [
            this.columns.organisationId,
        ]);

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
            this.organisationIdForeignKeyIndex,
            [this.columns.organisationId],
            this.organisationRefTable,
            [this.organisationIdRefColumn],
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
