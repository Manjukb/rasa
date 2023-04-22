import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class alterDashboardAddSupplierUserIdsColumn1668053493403 implements MigrationInterface {
    private tableName = 'dashboard';

    private columns = {
        rfqSupplierUserIds: 'rfq_supplier_user_ids',
    };

    public async up(queryRunner: QueryRunner): Promise<void> {
        const hasRfqSupplierUserIdsColumn = await queryRunner.hasColumn(
            this.tableName,
            this.columns.rfqSupplierUserIds,
        );
        if (hasRfqSupplierUserIdsColumn) {
            return;
        }
        await queryRunner.addColumn(
            this.tableName,
            new TableColumn({
                name: this.columns.rfqSupplierUserIds,
                type: 'json',
                isNullable: true,
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const hasRfqSupplierUserIdsColumn = await queryRunner.hasColumn(
            this.tableName,
            this.columns.rfqSupplierUserIds,
        );
        if (hasRfqSupplierUserIdsColumn) {
            await queryRunner.dropColumn(this.tableName, this.columns.rfqSupplierUserIds);
        }
    }
}
