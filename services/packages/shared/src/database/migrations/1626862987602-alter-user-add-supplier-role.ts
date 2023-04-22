import { MigrationInterface, QueryRunner } from 'typeorm';
import { Util } from '../../helpers';

export class AlterUserAddSupplierRole1626862987602 implements MigrationInterface {
    private userAuthorityEnum = 'user_authority_enum';
    private supplierRole = 'supplier';
    public async up(queryRunner: QueryRunner): Promise<void> {
        const list = await Util.getEnumValues(queryRunner, this.userAuthorityEnum);
        if (list.includes(this.supplierRole)) {
            return;
        }

        await queryRunner.query(`ALTER TYPE ${this.userAuthorityEnum} ADD VALUE '${this.supplierRole}'`);
    }

    public async down(): Promise<void> {
        // nothing to do
    }
}
