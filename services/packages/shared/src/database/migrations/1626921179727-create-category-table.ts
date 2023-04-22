import { MigrationInterface, QueryRunner, Table } from 'typeorm';
import { BusinessType } from '../../enum';
import { Util } from '../../helpers';
export class CreateCategoryTable1626921179727 implements MigrationInterface {
    private tableName = 'category';

    // search index
    private parentIdSearchIndex = 'category_parent_id_search_index';
    private nameSearchIndex = 'category_name_search_index';
    private organisationSearchIndex = 'category_organisation_search_index';
    private activeSearchIndex = 'category_active_search_index';
    private businessTypeSearchIndex = 'category_business_type_search_index';

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

    private columns = {
        id: 'id',
        name: 'name',
        parentId: 'parent_id',
        businessType: 'business_type',
        organisationId: 'organisation_id',
        createdBy: 'created_by',
        updatedBy: 'updated_by',
        createdDate: 'created_date',
        updatedDate: 'updated_date',
        isActive: 'is_active',
    };

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
                        name: this.columns.name,
                        type: 'varchar',
                        isNullable: false,
                        length: '40',
                    },
                    {
                        name: this.columns.parentId,
                        type: 'varchar',
                        isNullable: true,
                        length: '40',
                    },
                    {
                        name: this.columns.businessType,
                        type: 'enum',
                        isNullable: false,
                        enum: [BusinessType.sales, BusinessType.procurement, BusinessType.collections],
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
        await Util.createForeignKey(
            queryRunner,
            this.tableName,
            this.createdByForeignKeyIndex,
            [this.columns.createdBy],
            this.userRefTable,
            [this.userRefColumn],
        );

        await Util.createForeignKey(
            queryRunner,
            this.tableName,
            this.updatedByForeignKeyIndex,
            [this.columns.updatedBy],
            this.userRefTable,
            [this.userRefColumn],
        );

        await Util.createForeignKey(
            queryRunner,
            this.tableName,
            this.organisationIdForeignKeyIndex,
            [this.columns.organisationId],
            this.organistaionRefTable,
            [this.organisationRefColumn],
        );
        await this.createSearchIndex(queryRunner, this.nameSearchIndex, [this.columns.name]);
        await this.createSearchIndex(queryRunner, this.organisationSearchIndex, [this.columns.organisationId]);
        await this.createSearchIndex(queryRunner, this.parentIdSearchIndex, [this.columns.parentId]);
        await this.createSearchIndex(queryRunner, this.activeSearchIndex, [this.columns.isActive]);
        await this.createSearchIndex(queryRunner, this.businessTypeSearchIndex, [this.columns.businessType]);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const hasCategoryTable = await queryRunner.hasTable(this.tableName);
        if (!hasCategoryTable) {
            return;
        }
        await queryRunner.dropTable(this.tableName);
    }
}
