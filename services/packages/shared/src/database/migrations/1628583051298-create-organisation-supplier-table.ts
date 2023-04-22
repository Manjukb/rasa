import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';
import { Util } from '../../helpers';

export class CreateOrganisationSupplierTable1628583051298 implements MigrationInterface {
    private tableName = 'organisation_supplier';

    // search index
    private isApprovedSearchIndex = 'organisation_supplier_is_approved_index';
    private activeSearchIndex = 'organisation_supplier_active_search_index';
    private companyIdSearchIndex = 'organisation_supplier_company_id_search_index';
    private supplierIdSearchIndex = 'organisation_supplier_supplier_id_search_index';

    private columns = {
        id: 'id',
        isApproved: 'is_approved',
        isActive: 'is_active',
        organisationId: 'organisation_id',
        userId: 'user_id',
        createdDate: 'created_date',
        updatedDate: 'updated_date',
    };

    // foreign key index
    private companyIdForeignKeyIndex = 'organisation_supplier_org_id';
    private supplierIdForeignKeyIndex = 'organisation_supplier_user_id';

    // ref tables
    private supplierRefTable = 'user';
    private companyRfTable = 'organisation';

    //ref columns
    private companyRefColumn = 'organisation_id';
    private supplierRefColumn = 'user_id';

    public async up(queryRunner: QueryRunner): Promise<void> {
        const hasCompanyTable = await queryRunner.hasTable(this.tableName);
        if (hasCompanyTable) {
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
                        name: this.columns.isApproved,
                        type: 'boolean',
                        isNullable: false,
                        default: false,
                    },
                    {
                        name: this.columns.isActive,
                        type: 'boolean',
                        isNullable: false,
                        default: true,
                    },
                    {
                        name: this.columns.organisationId,
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

        await Util.createSearchIndex(queryRunner, this.tableName, this.isApprovedSearchIndex, [
            this.columns.isApproved,
        ]);
        await Util.createSearchIndex(queryRunner, this.tableName, this.activeSearchIndex, [this.columns.isActive]);
        await Util.createSearchIndex(queryRunner, this.tableName, this.companyIdSearchIndex, [
            this.columns.organisationId,
        ]);
        await Util.createSearchIndex(queryRunner, this.tableName, this.supplierIdSearchIndex, [this.columns.userId]);

        await queryRunner.createForeignKey(
            this.tableName,
            new TableForeignKey({
                name: this.companyIdForeignKeyIndex,
                columnNames: [this.columns.organisationId],
                referencedTableName: this.companyRfTable,
                referencedColumnNames: [this.companyRefColumn],
            }),
        );

        await queryRunner.createForeignKey(
            this.tableName,
            new TableForeignKey({
                name: this.supplierIdForeignKeyIndex,
                columnNames: [this.columns.userId],
                referencedTableName: this.supplierRefTable,
                referencedColumnNames: [this.supplierRefColumn],
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const hasCompanyTable = await queryRunner.hasTable(this.tableName);
        if (!hasCompanyTable) {
            return;
        }
        await queryRunner.dropTable(this.tableName);
    }
}
