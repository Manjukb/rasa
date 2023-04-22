import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CompanySupplierTable1628220002077 implements MigrationInterface {
    private tableName = 'company_supplier';

    // search index
    private isApprovedSearchIndex = 'company_supplier_is_approved_index';
    private activeSearchIndex = 'company_supplier_active_search_index';
    private companyIdSearchIndex = 'company_supplier_company_id_search_index';
    private supplierIdSearchIndex = 'company_supplier_supplier_id_search_index';

    private columns = {
        id: 'id',
        isApproved: 'is_approved',
        isActive: 'is_active',
        companyId: 'company_id',
        supplerId: 'supplier_id',
        createdDate: 'created_date',
        updatedDate: 'updated_date',
    };

    // foreign key index
    private companyIdForeignKeyIndex = 'company_supplier_company_id';
    private supplierIdForeignKeyIndex = 'company_supplier_supplier_id';

    // ref tables
    private supplierRefTable = 'supplier';
    private companyRfTable = 'company';

    //ref columns
    private companyRefColumn = 'id';
    private supplierRefColumn = 'id';

    private async createSearchIndex(queryRunner: QueryRunner, name: string, columnNames: string[]): Promise<void> {
        await queryRunner.createIndex(this.tableName, {
            name,
            columnNames,
            clone: undefined,
            isFulltext: true,
            isSpatial: false,
            isUnique: false,
            where: '',
        });
    }

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
                        name: this.columns.companyId,
                        type: 'varchar',
                        isNullable: false,
                        length: '40',
                    },
                    {
                        name: this.columns.supplerId,
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

        await this.createSearchIndex(queryRunner, this.isApprovedSearchIndex, [this.columns.isApproved]);
        await this.createSearchIndex(queryRunner, this.activeSearchIndex, [this.columns.isActive]);
        await this.createSearchIndex(queryRunner, this.companyIdSearchIndex, [this.columns.companyId]);
        await this.createSearchIndex(queryRunner, this.supplierIdSearchIndex, [this.columns.supplerId]);

        await queryRunner.createForeignKey(
            this.tableName,
            new TableForeignKey({
                name: this.companyIdForeignKeyIndex,
                columnNames: [this.columns.companyId],
                referencedTableName: this.companyRfTable,
                referencedColumnNames: [this.companyRefColumn],
            }),
        );

        await queryRunner.createForeignKey(
            this.tableName,
            new TableForeignKey({
                name: this.supplierIdForeignKeyIndex,
                columnNames: [this.columns.supplerId],
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
