import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AlterRfqTables1631501689706 implements MigrationInterface {
    private table = 'rfq';
    private columns = {
        parameter: 'parameter',
        negotiationProcess: 'negotiation_process',
        targetSavingRate: 'target_saving_rate',
        paymentTerms: 'payment_terms',
        contractTerms: 'contract_terms',
    };

    public async up(queryRunner: QueryRunner): Promise<void> {
        const hasColumn = await queryRunner.hasColumn(this.table, this.columns.parameter);
        if (hasColumn) {
            return;
        }

        await queryRunner.addColumns(this.table, [
            new TableColumn({
                name: this.columns.parameter,
                type: 'jsonb',
            }),

            new TableColumn({
                name: this.columns.negotiationProcess,
                type: 'jsonb',
            }),
        ]);

        const hasColumnTargetSavingRate = await queryRunner.hasColumn(this.table, this.columns.targetSavingRate);
        if (hasColumnTargetSavingRate) {
            await queryRunner.dropColumn(this.table, this.columns.targetSavingRate);
            await queryRunner.dropColumn(this.table, this.columns.paymentTerms);
            await queryRunner.dropColumn(this.table, this.columns.contractTerms);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const hasColumn = await queryRunner.hasColumn(this.table, this.columns.parameter);
        if (hasColumn) {
            await queryRunner.dropColumn(this.table, this.columns.parameter);
            await queryRunner.dropColumn(this.table, this.columns.negotiationProcess);
        }
    }
}
