import { MigrationInterface, QueryRunner } from 'typeorm';

export class alterNegotiationInvalidSupplierIdsName1638517204594 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "negotiation"
        RENAME "invalid_supplier_ids" TO "valid_supplier_ids"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "negotiation"
        RENAME "valid_supplier_ids" TO "invalid_supplier_ids"`);
    }
}
