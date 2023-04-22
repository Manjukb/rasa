import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AlterProductAddColumnHasPaymentTerms1626177879631 implements MigrationInterface {
    private table = 'product';
    private column = 'has_payment_terms';

    public async up(queryRunner: QueryRunner): Promise<void> {
        const hasColumn = await queryRunner.hasColumn(this.table, this.column);
        if (hasColumn) {
            return;
        }

        await queryRunner.addColumn(
            this.table,
            new TableColumn({
                name: this.column,
                type: 'boolean',
                isNullable: false,
                default: false,
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const hasColumn = await queryRunner.hasColumn(this.table, this.column);
        if (!hasColumn) {
            return;
        }

        return await queryRunner.dropColumn(this.table, this.column);
    }
}
