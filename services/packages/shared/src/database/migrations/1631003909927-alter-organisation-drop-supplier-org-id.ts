import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterOrganisationDropSupplierOrgId1631003909927 implements MigrationInterface {
    private organisationTable = 'organisation';
    private columnName = 'supplier_organisation_id';
    public async up(queryRunner: QueryRunner): Promise<void> {
        const hasColumn = await queryRunner.hasColumn(this.organisationTable, this.columnName);
        hasColumn && (await queryRunner.dropColumn(this.organisationTable, this.columnName));
    }

    public async down(): Promise<void> {
        console.log('\x1b[33m%s\x1b[0m', `Nothing to do in down`);
    }
}
