import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class alterRfqAddSupplierIdColumn1659348729838 implements MigrationInterface {
    private tableName = 'rfq';

    private columns = {
        supplierId: 'supplier_id',
    };

    public async up(queryRunner: QueryRunner): Promise<void> {
        const hasSupplierIdColumn = await queryRunner.hasColumn(this.tableName, this.columns.supplierId);
        if (hasSupplierIdColumn) {
            return;
        }
        await queryRunner.addColumn(
            this.tableName,
            new TableColumn({
                name: this.columns.supplierId,
                type: 'int',
                isNullable: true,
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const hasSupplierIdColumn = await queryRunner.hasColumn(this.tableName, this.columns.supplierId);
        if (hasSupplierIdColumn) {
            await queryRunner.dropColumn(this.tableName, this.columns.supplierId);
        }
    }
}
