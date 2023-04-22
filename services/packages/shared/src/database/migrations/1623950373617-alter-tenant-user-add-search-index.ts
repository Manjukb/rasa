import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterTenantUserAddSearchIndex1623950373617 implements MigrationInterface {
    private table = 'tenant_user';
    private identifierSearchIndex = 'tenant_user_identifier';
    private identifierColum = 'identifier';
    private tenantIdSearchIndex = 'tenant_user_tenant_id';
    private tenantIdColum = 'tenant_id';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createIndex(this.table, {
            name: this.identifierSearchIndex,
            columnNames: [this.identifierColum],
            clone: undefined,
            isFulltext: true,
            isSpatial: false,
            isUnique: false,
            where: '',
        });

        await queryRunner.createIndex(this.table, {
            name: this.tenantIdSearchIndex,
            columnNames: [this.tenantIdColum],
            clone: undefined,
            isFulltext: true,
            isSpatial: false,
            isUnique: false,
            where: '',
        });
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropIndex(this.table, this.identifierSearchIndex);
        await queryRunner.dropIndex(this.table, this.tenantIdSearchIndex);
    }
}
