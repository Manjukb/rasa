import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class alterTableProductAddQuantityColumn1660628102287 implements MigrationInterface {
    private tableName = 'product';

    private columns = {
        quantity: 'quantity',
    };

    public async up(queryRunner: QueryRunner): Promise<void> {
        const hasQuantityColumn = await queryRunner.hasColumn(this.tableName, this.columns.quantity);
        if (hasQuantityColumn) {
            return;
        }
        await queryRunner.addColumn(
            this.tableName,
            new TableColumn({
                name: this.columns.quantity,
                type: 'int',
                isNullable: true,
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const hasQuantityColumn = await queryRunner.hasColumn(this.tableName, this.columns.quantity);
        if (hasQuantityColumn) {
            await queryRunner.dropColumn(this.tableName, this.columns.quantity);
        }
    }
}
