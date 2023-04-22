import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';

export class AlterProductAsPerProcurement1627535900992 implements MigrationInterface {
    private tableName = 'product';

    private columns = {
        name: 'name',
        categoryId: 'category_id',
        subCategoryId: 'sub_category_id',
        image_url: 'image-url',
        description: 'description',
    };

    // search index
    private nameSearchIndex = 'product_name_search_index';
    private categoryIdSearchIndex = 'product_category_id_search_index';
    private subCategorySearchIndex = 'product_sub_category_id_search_index';

    // foreign key index
    private categoryIdForeignKeyIndex = 'category_creator';
    private subCategoryIdForeignKeyIndex = 'category_updater';

    // ref tables
    private categoryRefTable = 'category';

    //ref columns
    private categoryRefColumn = 'id';

    public async createSearchIndex(queryRunner: QueryRunner, name: string, columnNames: string[]): Promise<void> {
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

    public async createForeignKey(
        queryRunner: QueryRunner,
        name: string,
        columnNames: string[],
        refTable: string,
        referencedColumnNames: string[],
    ): Promise<void> {
        await queryRunner.createForeignKey(this.tableName, {
            name,
            columnNames,
            referencedTableName: refTable,
            referencedColumnNames,
            clone: undefined,
        });
    }
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "product" ALTER COLUMN "product_code" TYPE VARCHAR(120), ALTER COLUMN "product_code" DROP NOT NULL, ALTER COLUMN "product_code" DROP DEFAULT`,
        );
        const hasCategoryId = await queryRunner.hasColumn(this.tableName, this.columns.categoryId);
        if (hasCategoryId) {
            return;
        }

        await queryRunner.addColumns(this.tableName, [
            new TableColumn({
                name: this.columns.name,
                type: 'varchar',
                length: '120',
                isNullable: true,
            }),
            new TableColumn({
                name: this.columns.categoryId,
                type: 'varchar',
                isNullable: true,
                length: '40',
            }),
            new TableColumn({
                name: this.columns.subCategoryId,
                type: 'varchar',
                isNullable: true,
                length: '40',
            }),
            new TableColumn({
                name: this.columns.image_url,
                type: 'text',
                isNullable: true,
            }),
            new TableColumn({
                name: this.columns.description,
                type: 'json',
                isNullable: true,
            }),
        ]);

        await this.createSearchIndex(queryRunner, this.nameSearchIndex, [this.columns.name]);
        await this.createSearchIndex(queryRunner, this.categoryIdSearchIndex, [this.columns.categoryId]);
        await this.createSearchIndex(queryRunner, this.subCategorySearchIndex, [this.columns.subCategoryId]);
        await queryRunner.createForeignKey(
            this.tableName,
            new TableForeignKey({
                columnNames: [this.columns.categoryId],
                referencedColumnNames: [this.categoryRefColumn],
                referencedTableName: this.categoryRefTable,
                name: this.categoryIdForeignKeyIndex,
            }),
        );

        await queryRunner.createForeignKey(
            this.tableName,
            new TableForeignKey({
                name: this.subCategoryIdForeignKeyIndex,
                columnNames: [this.columns.subCategoryId],
                referencedTableName: this.categoryRefTable,
                referencedColumnNames: [this.categoryRefColumn],
            }),
        );
    }

    public async down(): Promise<void> {
        // noting to do here
    }
}
