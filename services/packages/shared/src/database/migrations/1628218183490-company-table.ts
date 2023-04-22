import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CompanyTable1628218183490 implements MigrationInterface {
    private tableName = 'company';

    // search index
    private nameSearchIndex = 'company_name_search_index';
    private addressSearchIndex = 'company_address_search_index';
    private activeSearchIndex = 'company_active_search_index';
    private createdBySearchIndex = 'company_created_by_search_index';
    private organisationIdSearchIndex = 'company_organisation_id_search_index';

    private columns = {
        id: 'id',
        name: 'name',
        address: 'address',
        organisationId: 'organisation_id',
        isActive: 'is_active',
        createdDate: 'created_date',
        updatedDate: 'updated_date',
        createdBy: 'created_by',
        updatedBy: 'updated_by',
    };

    // foreign key index
    private createdByForeignKeyIndex = 'category_creator';
    private updatedByForeignKeyIndex = 'category_updater';
    private organisationIdForeignKeyIndex = 'category_organisation';

    // ref tables
    private userRefTable = 'user';
    private organistaionRefTable = 'organisation';

    //ref columns
    private userRefColumn = 'user_id';
    private organisationRefColumn = 'organisation_id';

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
                        name: this.columns.name,
                        type: 'varchar',
                        isNullable: false,
                        length: '40',
                    },
                    {
                        name: this.columns.address,
                        type: 'varchar',
                        isNullable: false,
                        length: '80',
                    },
                    {
                        name: this.columns.isActive,
                        type: 'boolean',
                        isNullable: false,
                        default: true,
                    },
                    {
                        name: this.columns.createdBy,
                        type: 'varchar',
                        isNullable: false,
                        length: '40',
                    },
                    {
                        name: this.columns.updatedBy,
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

        await this.createSearchIndex(queryRunner, this.nameSearchIndex, [this.columns.name]);
        await this.createSearchIndex(queryRunner, this.addressSearchIndex, [this.columns.address]);
        await this.createSearchIndex(queryRunner, this.activeSearchIndex, [this.columns.isActive]);
        await this.createSearchIndex(queryRunner, this.organisationIdSearchIndex, [this.columns.organisationId]);
        await this.createSearchIndex(queryRunner, this.createdBySearchIndex, [this.columns.createdBy]);

        await queryRunner.createForeignKey(
            this.tableName,
            new TableForeignKey({
                name: this.createdByForeignKeyIndex,
                columnNames: [this.columns.createdBy],
                referencedTableName: this.userRefTable,
                referencedColumnNames: [this.userRefColumn],
            }),
        );

        await queryRunner.createForeignKey(
            this.tableName,
            new TableForeignKey({
                name: this.updatedByForeignKeyIndex,
                columnNames: [this.columns.updatedBy],
                referencedTableName: this.userRefTable,
                referencedColumnNames: [this.userRefColumn],
            }),
        );

        await queryRunner.createForeignKey(
            this.tableName,
            new TableForeignKey({
                name: this.organisationIdForeignKeyIndex,
                columnNames: [this.columns.organisationId],
                referencedTableName: this.organistaionRefTable,
                referencedColumnNames: [this.organisationRefColumn],
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
