import { MigrationInterface, QueryRunner, TableColumn, TableIndex } from 'typeorm';

export class AlterCustomerAddColumnIsUserCreatedOnChannel1624839208488 implements MigrationInterface {
    private table = 'customer';
    private column = 'is_on_channel';
    private searchIndex = 'customer_is_on_channel_index';

    public async up(queryRunner: QueryRunner): Promise<void> {
        const hasTenantIdentifierColumn = await queryRunner.hasColumn(this.table, this.column);
        if (hasTenantIdentifierColumn) {
            return;
        }
        await queryRunner.addColumn(
            this.table,
            new TableColumn({
                name: this.column,
                type: 'boolean',
                isNullable: true,
                default: false,
            }),
        );

        await queryRunner.createIndex(
            this.table,
            new TableIndex({ columnNames: [this.column], name: this.searchIndex }),
        );

        await queryRunner.query(`UPDATE "${this.table}" set ${this.column} = true`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const hasTenantIdentifierColumn = await queryRunner.hasColumn(this.table, this.column);
        if (!hasTenantIdentifierColumn) {
            return;
        }
        await queryRunner.dropIndex(this.table, this.searchIndex);
        await queryRunner.dropColumn(this.table, this.column);
    }
}
