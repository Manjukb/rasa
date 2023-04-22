import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AlterTenantAddTenantIdentifier1622369529635 implements MigrationInterface {
    private table = 'tenant';
    private column = 'identifier';
    private searchIndex = 'tenant_identifier_index';
    public async up(queryRunner: QueryRunner): Promise<void> {
        const hasTenantIdentifierColumn = await queryRunner.hasColumn(this.table, this.column);
        if (hasTenantIdentifierColumn) {
            return;
        }
        await queryRunner.addColumn(
            this.table,
            new TableColumn({
                name: this.column,
                isUnique: true,
                type: 'varchar',
                length: '128',
                isNullable: true,
            }),
        );

        await queryRunner.createIndex(this.table, {
            name: this.searchIndex,
            columnNames: [this.column],
            clone: undefined,
            isFulltext: true,
            isSpatial: false,
            isUnique: false,
            where: '',
        });
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
