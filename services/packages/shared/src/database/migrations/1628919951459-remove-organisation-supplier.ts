import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveOrganisationSupplier1628919951459 implements MigrationInterface {
    private table = 'organisation_supplier';
    public async up(queryRunner: QueryRunner): Promise<void> {
        const hasTable = await queryRunner.hasTable(this.table);
        if (hasTable) {
            await queryRunner.dropTable(this.table);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const hasTable = await queryRunner.hasTable(this.table);
        if (hasTable) {
            await queryRunner.dropTable(this.table);
        }
    }
}
