import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
import { Util } from '../..';

export class AlterNegotiationTable1633260316012 implements MigrationInterface {
    private table = 'negotiation';
    private column = 'rfq_id';

    private refTable = 'rfq';
    private refColumn = 'id';

    // search index
    private rfqIdSearchIndex = 'negotiation_rfq_id_search_index';

    // foreign key index
    private rfqIdForeignKeyIndex = 'negotiation_rfq_id_f_key';

    public async up(queryRunner: QueryRunner): Promise<void> {
        const hasColumn = await queryRunner.hasColumn(this.table, this.column);
        if (hasColumn) {
            return;
        }

        await queryRunner.query(`
            ALTER TABLE "negotiation"
            ALTER COLUMN "customer_id" TYPE VARCHAR(40),
            ALTER COLUMN "customer_id" DROP NOT NULL,
            ALTER COLUMN "customer_id" DROP DEFAULT;

            ALTER TABLE "negotiation"
            ALTER COLUMN "product_id" TYPE VARCHAR(40),
            ALTER COLUMN "product_id" DROP NOT NULL,
            ALTER COLUMN "product_id" DROP DEFAULT;

            ALTER TABLE "negotiation"
            ALTER COLUMN "channel_id" TYPE VARCHAR(64),
            ALTER COLUMN "channel_id" DROP NOT NULL,
            ALTER COLUMN "channel_id" DROP DEFAULT;

            ALTER TABLE "negotiation"
            ALTER COLUMN "product_code" TYPE VARCHAR(40),
            ALTER COLUMN "product_code" DROP NOT NULL,
            ALTER COLUMN "product_code" DROP DEFAULT;
        `);

        await queryRunner.addColumn(
            this.table,
            new TableColumn({
                name: this.column,
                type: 'varchar',
                length: '40',
                isNullable: true,
            }),
        );

        await Util.createSearchIndex(queryRunner, this.table, this.rfqIdSearchIndex, [this.column]);
        await Util.createForeignKey(queryRunner, this.table, this.rfqIdForeignKeyIndex, [this.column], this.refTable, [
            this.refColumn,
        ]);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const hasColumn = await queryRunner.hasColumn(this.table, this.column);
        if (!hasColumn) {
            return;
        }

        await queryRunner.query(`
            ALTER TABLE "negotiation"
            ALTER COLUMN "customer_id" TYPE VARCHAR(40),
            ALTER COLUMN "customer_id" SET NOT NULL,
            ALTER COLUMN "customer_id" DROP DEFAULT;
    
            ALTER TABLE "negotiation"
            ALTER COLUMN "product_id" TYPE VARCHAR(40),
            ALTER COLUMN "product_id" SET NOT NULL,
            ALTER COLUMN "product_id" DROP DEFAULT;
        
            ALTER TABLE "negotiation"
            ALTER COLUMN "channel_id" TYPE VARCHAR(64),
            ALTER COLUMN "channel_id" SET NOT NULL,
            ALTER COLUMN "channel_id" DROP DEFAULT;
        
            ALTER TABLE "negotiation"
            ALTER COLUMN "product_code" TYPE VARCHAR(40),
            ALTER COLUMN "product_code" SET NOT NULL,
            ALTER COLUMN "product_code" DROP DEFAULT;
        `);

        await queryRunner.dropColumn(this.table, this.column);
    }
}
