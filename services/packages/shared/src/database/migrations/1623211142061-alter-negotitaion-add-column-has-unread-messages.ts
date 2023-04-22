import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AlterNegotitaionAddColumnHasUnreadMessages1623211142061 implements MigrationInterface {
    private table = 'negotiation';
    private column = 'has_unread_messages';
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
                default: false,
                isNullable: false,
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const hasColumn = await queryRunner.hasColumn(this.table, this.column);
        if (!hasColumn) {
            return;
        }
        await queryRunner.dropColumn(this.table, this.column);
    }
}
