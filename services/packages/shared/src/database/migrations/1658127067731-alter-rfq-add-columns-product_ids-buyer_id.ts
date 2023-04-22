import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class alterRfqAddColumnsProductIdsBuyerId1658127067731 implements MigrationInterface {
    private tableName = 'rfq';

    private columns = {
        productIds: 'product_ids',
        buyerId: 'buyer_id',
    };

    public async up(queryRunner: QueryRunner): Promise<void> {
        const hasProductIdsColumn = await queryRunner.hasColumn(this.tableName, this.columns.productIds);
        if (hasProductIdsColumn) {
            return;
        }
        await queryRunner.addColumn(
            this.tableName,
            new TableColumn({
                name: this.columns.productIds,
                type: 'jsonb',
                isNullable: true,
            }),
        );
        const hasBuyerIdColumn = await queryRunner.hasColumn(this.tableName, this.columns.buyerId);
        if (hasBuyerIdColumn) {
            return;
        }
        await queryRunner.addColumn(
            this.tableName,
            new TableColumn({
                name: this.columns.buyerId,
                type: 'int',
                isNullable: true,
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const hasProductIdsColumn = await queryRunner.hasColumn(this.tableName, this.columns.productIds);
        if (hasProductIdsColumn) {
            await queryRunner.dropColumn(this.tableName, this.columns.productIds);
        }
        const hasBuyerIdColumn = await queryRunner.hasColumn(this.tableName, this.columns.buyerId);
        if (hasBuyerIdColumn) {
            await queryRunner.dropColumn(this.tableName, this.columns.buyerId);
        }
    }
}
