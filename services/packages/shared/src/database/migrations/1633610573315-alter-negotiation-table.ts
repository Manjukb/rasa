import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AlterNegotiationTable1633610573315 implements MigrationInterface {
    private table = 'negotiation';
    private column = 'invalid_supplier_ids';
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
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const hasColumn = await queryRunner.hasColumn(this.table, this.column);
        if (hasColumn) {
            await queryRunner.dropColumn(this.table, this.column);
        }
    }
}
