import { MigrationInterface, QueryRunner } from 'typeorm';

import { Util } from '../../helpers';

export class alterRfqSetFKToSupplierTable1637660556539 implements MigrationInterface {
    private table = 'rfq';
    private column = 'winner_supplier_id';

    private winner_supplierForeignKeyIndex = 'rfq_winner_supplier';

    // ref tables
    private supplierRefTable = 'supplier';

    //ref columns
    private supplierRefColumn = 'id';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "public"."rfq" DROP CONSTRAINT "rfq_winner_supplier"`);

        await Util.createForeignKey(
            queryRunner,
            this.table,
            this.winner_supplierForeignKeyIndex,
            [this.column],
            this.supplierRefTable,
            [this.supplierRefColumn],
        );
    }

    public async down(): Promise<void> {
        console.warn('no need to update foreign-key for column winner_supplier_id again');
    }
}
