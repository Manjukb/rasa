import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterRfqSupplierTable1632136493629 implements MigrationInterface {
    private table = 'rfq_supplier';
    private column = 'is_mail_sent';

    public async up(queryRunner: QueryRunner): Promise<void> {
        const hasColumn = await queryRunner.hasColumn(this.table, this.column);
        if (hasColumn) {
            await queryRunner.query(`ALTER TABLE "rfq_supplier" RENAME COLUMN "is_mail_sent" TO "send_mail"`);

            await queryRunner.query(`ALTER TABLE "rfq_supplier"
                ALTER COLUMN "send_mail" TYPE BOOLEAN,
                ALTER COLUMN "send_mail" SET NOT NULL,
                ALTER COLUMN "send_mail" SET DEFAULT 'false'`);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const hasColumn = await queryRunner.hasColumn(this.table, 'send_mail');
        if (hasColumn) {
            await queryRunner.query(`ALTER TABLE "rfq_supplier"
                RENAME COLUMN "send_mail" TO "is_mail_sent"`);

            await queryRunner.query(`ALTER TABLE "rfq_supplier"
            ALTER COLUMN "is_mail_sent" TYPE BOOLEAN,
            ALTER COLUMN "is_mail_sent" SET NOT NULL,
            ALTER COLUMN "is_mail_sent" SET DEFAULT 'false'`);
        }
    }
}
