import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AlterProductAddActiveColumn1627955801758 implements MigrationInterface {
    private table = 'product';
    private columns = {
        isActive: 'is_active',
        imageUrl: 'img-url',
        productId: 'productId',
    };

    public async up(queryRunner: QueryRunner): Promise<void> {
        const hasImageUrlColumn = await queryRunner.hasColumn(this.table, this.columns.imageUrl);
        hasImageUrlColumn && (await queryRunner.dropColumn(this.table, this.columns.imageUrl));

        const hasProductIdColumn = await queryRunner.hasColumn(this.table, this.columns.productId);
        hasProductIdColumn && (await queryRunner.dropColumn(this.table, this.columns.productId));

        const hasIsActiveColumn = await queryRunner.hasColumn(this.table, this.columns.isActive);
        if (hasIsActiveColumn) {
            return;
        }
        await queryRunner.addColumn(
            this.table,
            new TableColumn({
                name: this.columns.isActive,
                type: 'boolean',
                default: true,
                isNullable: true,
            }),
        );
    }

    public async down(): Promise<void> {
        // nothing to do
    }
}
