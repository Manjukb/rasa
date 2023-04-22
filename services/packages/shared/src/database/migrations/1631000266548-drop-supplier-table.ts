import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropSupplierTable1631000266548 implements MigrationInterface {
    private supplierTable = 'supplier';
    private companyTable = 'company';
    private companySupplierTable = 'company_supplier';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable(this.companySupplierTable, true);
        await queryRunner.dropTable(this.supplierTable, true);
        await queryRunner.dropTable(this.companyTable, true);
        console.log(
            '\x1b[33m%s\x1b[0m',
            `Tables: ${this.supplierTable}, ${this.companySupplierTable}, ${this.companyTable} are removed`,
        );
    }

    public async down(): Promise<void> {
        console.log('\x1b[33m%s\x1b[0m', `Nothing to do in down`);
    }
}
