import { MigrationInterface, QueryRunner, TableColumn, getRepository } from 'typeorm';
import { Rfq, RfqItem } from '../models';

export class AlterRfqTableAddCategoryIds1632913273430 implements MigrationInterface {
    private table = 'rfq';
    private column = 'category_ids';
    public async up(queryRunner: QueryRunner): Promise<void> {
        const hasColumn = await queryRunner.hasColumn(this.table, this.column);
        if (hasColumn) {
            return;
        }

        await queryRunner.addColumn(
            this.table,
            new TableColumn({
                name: this.column,
                type: 'jsonb',
                isNullable: true,
            }),
        );

        const rfqItems = await getRepository(RfqItem)
            .createQueryBuilder('item')
            .select(['item.rfq_id', 'item.category_id', 'item.id'])
            .getMany();

        rfqItems.forEach(
            async (rfqItem: RfqItem): Promise<void> => {
                await getRepository(Rfq).update({ id: rfqItem.rfq_id }, { category_ids: [rfqItem.category_id] });
            },
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const hasColumn = await queryRunner.hasColumn(this.table, this.column);
        if (hasColumn) {
            await queryRunner.dropColumn(this.table, this.column);
        }
    }
}
