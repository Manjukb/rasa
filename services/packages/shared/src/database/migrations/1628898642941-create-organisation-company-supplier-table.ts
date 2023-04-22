import { MigrationInterface, QueryRunner, Table } from 'typeorm';
import { Util } from '../../helpers';

export class CreateOrganisationCompanySupplierTable1628898642941 implements MigrationInterface {
    private tableName = 'organisation_company_supplier';

    // search index
    private organisationIdSearchIndex = 'organisation_company_supplier_organisation_id_search_index';
    private companyIdSearchIndex = 'organisation_company_supplier_company_id_search_index';
    private supplierIdSearchIndex = 'organisation_company_supplier_supplier_id_search_index';

    private columns = {
        id: 'id',
        organisationId: 'organisation_id',
        companyId: 'company_id',
        userId: 'user_id',
        createdDate: 'created_date',
        updatedDate: 'updated_date',
    };

    // foreign key index
    private organisationIdForeignKeyIndex = 'organisation_company_supplier_org_id';
    private companyIdForeignKeyIndex = 'organisation_company_supplier_company_id';
    private supplierIdForeignKeyIndex = 'organisation_company_supplier_user_id';

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
                        name: this.columns.organisationId,
                        type: 'varchar',
                        isNullable: false,
                        length: '40',
                    },
                    {
                        name: this.columns.companyId,
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
        await Util.createSearchIndex(queryRunner, this.tableName, this.organisationIdSearchIndex, [
            this.columns.organisationId,
        ]);
        await Util.createSearchIndex(queryRunner, this.tableName, this.companyIdSearchIndex, [this.columns.companyId]);
        await Util.createSearchIndex(queryRunner, this.tableName, this.supplierIdSearchIndex, [this.columns.userId]);

        await Util.createForeignKey(
            queryRunner,
            this.tableName,
            this.organisationIdForeignKeyIndex,
            [this.columns.organisationId],
            this.companyRfTable,
            [this.companyRefColumn],
        );
        await Util.createForeignKey(
            queryRunner,
            this.tableName,
            this.companyIdForeignKeyIndex,
            [this.columns.companyId],
            this.companyRfTable,
            [this.companyRefColumn],
        );

        await Util.createForeignKey(
            queryRunner,
            this.tableName,
            this.supplierIdForeignKeyIndex,
            [this.columns.userId],
            this.supplierRefTable,
            [this.supplierRefColumn],
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
