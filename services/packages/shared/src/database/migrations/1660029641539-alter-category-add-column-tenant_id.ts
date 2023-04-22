import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class alterCategoryAddColumnTenantId1660029641539 implements MigrationInterface {
    private tableName = 'category';

    private columns = {
        tenantId: 'tenant_id',
    };

    public async up(queryRunner: QueryRunner): Promise<void> {
        const hasTenantIdColumn = await queryRunner.hasColumn(this.tableName, this.columns.tenantId);
        if (hasTenantIdColumn) {
            return;
        }
        await queryRunner.addColumn(
            this.tableName,
            new TableColumn({
                name: this.columns.tenantId,
                type: 'varchar',
                length: '40',
                isNullable: true,
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const hasTenantIdColumn = await queryRunner.hasColumn(this.tableName, this.columns.tenantId);
        if (hasTenantIdColumn) {
            await queryRunner.dropColumn(this.tableName, this.columns.tenantId);
        }
    }
}
