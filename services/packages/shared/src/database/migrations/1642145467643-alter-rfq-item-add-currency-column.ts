import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
import { Product, RfqItem } from '../..';

export class alterRfqItemAddCurrencyColumn1642145467643 implements MigrationInterface {
    private table = 'rfq_item';
    private columns = {
        currency: 'currency',
    };

    public async up(queryRunner: QueryRunner): Promise<void> {
        const hasCurrencyColumn = await queryRunner.hasColumn(this.table, this.columns.currency);
        if (hasCurrencyColumn) {
            return;
        }

        await queryRunner.addColumns(this.table, [
            new TableColumn({
                name: this.columns.currency,
                type: 'varchar',
                length: '16',
                isNullable: true,
            }),
        ]);

        const products = await queryRunner.manager
            .createQueryBuilder()
            .from(Product, 'product')
            .select(['product.currency', 'product.id'])
            .getMany();

        (products || []).forEach(
            async (product: Product): Promise<void> => {
                await queryRunner.manager
                    .createQueryBuilder()
                    .update(RfqItem)
                    .set({ currency: product.currency })
                    .where({ product_id: product.id })
                    .execute();
            },
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const hasCurrencyColumn = await queryRunner.hasColumn(this.table, this.columns.currency);
        if (hasCurrencyColumn) {
            await queryRunner.dropColumn(this.table, this.columns.currency);
        }
    }
}
