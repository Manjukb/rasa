import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AlterProductAddUomAndParameter1631174043815 implements MigrationInterface {
    private table = 'product';
    private uomColumn = 'uom';
    private priceColumn = 'price';
    private currencyColumn = 'currency';
    public async up(queryRunner: QueryRunner): Promise<void> {
        const hasUomColumn = await queryRunner.hasColumn(this.table, this.uomColumn);
        if (hasUomColumn) {
            return;
        }
        // add uom column
        await queryRunner.addColumn(
            this.table,
            new TableColumn({
                name: this.uomColumn,
                type: 'varchar',
                length: '16',
                isNullable: true,
            }),
        );
        // add price column
        await queryRunner.addColumn(
            this.table,
            new TableColumn({
                name: this.priceColumn,
                type: 'decimal(8,2)',
                isNullable: true,
            }),
        );
        // add currency column
        await queryRunner.addColumn(
            this.table,
            new TableColumn({
                name: this.currencyColumn,
                type: 'varchar',
                length: '16',
                isNullable: true,
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const hasUomColumn = await queryRunner.hasColumn(this.table, this.uomColumn);
        if (hasUomColumn) {
            await queryRunner.dropColumn(this.table, this.uomColumn);
            await queryRunner.dropColumn(this.table, this.priceColumn);
            await queryRunner.dropColumn(this.table, this.currencyColumn);
        }
    }
}
