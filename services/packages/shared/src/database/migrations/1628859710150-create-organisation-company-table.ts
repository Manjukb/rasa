import { MigrationInterface, QueryRunner, Table } from 'typeorm';
import { Util } from '../../helpers';

export class CreateOrganisationCompanyTable1628859710150 implements MigrationInterface {
    private tableName = 'organisation_company';

    // search index
    private activeSearchIndex = 'organisation_company_active_search_index';
    private companyIdSearchIndex = 'organisation_company_company_id_search_index';

    private columns = {
        id: 'id',
        organisationId: 'organisation_id',
        companyId: 'company_id',
        createdDate: 'created_date',
        updatedDate: 'updated_date',
    };

    // foreign key index
    private companyIdForeignKeyIndex = 'organisation_company_org_id';
    private supplierIdForeignKeyIndex = 'organisation_company_company_id';

    // ref tables
    private organisationRfTable = 'organisation';

    //ref columns
    private organisationRefColumn = 'organisation_id';

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

        await Util.createSearchIndex(queryRunner, this.tableName, this.activeSearchIndex, [this.columns.companyId]);
        await Util.createSearchIndex(queryRunner, this.tableName, this.companyIdSearchIndex, [
            this.columns.organisationId,
        ]);

        await Util.createForeignKey(
            queryRunner,
            this.tableName,
            this.companyIdForeignKeyIndex,
            [this.columns.organisationId],
            this.organisationRfTable,
            [this.organisationRefColumn],
        );

        await Util.createForeignKey(
            queryRunner,
            this.tableName,
            this.supplierIdForeignKeyIndex,
            [this.columns.companyId],
            this.organisationRfTable,
            [this.organisationRefColumn],
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
