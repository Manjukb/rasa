import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AlterSupplierAddCategoryIdsColumn1631430456614 implements MigrationInterface {
    private table = 'supplier';
    private column = 'category_ids';
    public async up(queryRunner: QueryRunner): Promise<void> {
        const hasColumn = await queryRunner.hasColumn(this.table, this.column);
        if (hasColumn) {
            return;
        }

        await queryRunner.addColumn(
            this.table,
            new TableColumn({ name: this.column, type: 'jsonb', isNullable: true }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const hasColumn = await queryRunner.hasColumn(this.table, this.column);
        if (hasColumn) {
            await queryRunner.dropColumn(this.table, this.column);
        }
    }
}
