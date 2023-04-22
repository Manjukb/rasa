import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
import { Util } from '../..';

export class AlterRfqItemAddCategoryId1631507042622 implements MigrationInterface {
    private table = 'rfq_item';
    private columns = {
        categoryId: 'category_id',
    };

    // search index
    private categoryIdSearchIndex = 'rfq_item_category_id_search_index';

    // foreign key index
    private categoryIdFKey = 'rfq_item_category_id_f_kqy';

    // ref tables
    private categoryRefTable = 'category';

    // ref columns
    private categoryRefColumn = 'id';

    public async up(queryRunner: QueryRunner): Promise<void> {
        const hasCategoryColumn = await queryRunner.hasColumn(this.table, this.columns.categoryId);
        if (hasCategoryColumn) {
            return;
        }

        await queryRunner.addColumns(this.table, [
            new TableColumn({
                name: this.columns.categoryId,
                type: 'varchar',
                length: '40',
            }),
        ]);

        // adding search index
        await Util.createSearchIndex(queryRunner, this.table, this.categoryIdSearchIndex, [this.columns.categoryId]);

        // adding foreign key index
        await Util.createForeignKey(
            queryRunner,
            this.table,
            this.categoryIdFKey,
            [this.columns.categoryId],
            this.categoryRefTable,
            [this.categoryRefColumn],
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const hasCategoryColumn = await queryRunner.hasColumn(this.table, this.columns.categoryId);
        if (hasCategoryColumn) {
            await queryRunner.dropColumn(this.table, this.columns.categoryId);
        }
    }
}
