import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class alterProductAddIsManualNego1663820789907 implements MigrationInterface {
    private tableName = 'product';

    private columns = {
        isManualNego: 'is_manual_nego',
    };

    public async up(queryRunner: QueryRunner): Promise<void> {
        const hasIsManualNegoColumn = await queryRunner.hasColumn(this.tableName, this.columns.isManualNego);
        if (hasIsManualNegoColumn) {
            return;
        }
        await queryRunner.addColumn(
            this.tableName,
            new TableColumn({
                name: this.columns.isManualNego,
                type: 'boolean',
                isNullable: true,
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const hasIsManualNegoColumn = await queryRunner.hasColumn(this.tableName, this.columns.isManualNego);
        if (hasIsManualNegoColumn) {
            await queryRunner.dropColumn(this.tableName, this.columns.isManualNego);
        }
    }
}
