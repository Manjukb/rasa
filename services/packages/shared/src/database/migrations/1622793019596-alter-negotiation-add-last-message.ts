import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AlterNegotiationAddLastMessage1622793019596 implements MigrationInterface {
    private table = 'negotiation';
    private column = 'last_message';
    public async up(queryRunner: QueryRunner): Promise<void> {
        const hasColumn = await queryRunner.hasColumn(this.table, this.column);
        if (hasColumn) {
            return;
        }
        await queryRunner.addColumn(
            this.table,
            new TableColumn({
                name: 'last_message',
                type: 'json',
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
