import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AlterOrganisationAddTimezone1631791451607 implements MigrationInterface {
    private table = 'organisation';
    private columnName = 'timezone';
    public async up(queryRunner: QueryRunner): Promise<void> {
        const hasTimezoneColumn = await queryRunner.hasColumn(this.table, this.columnName);
        if (hasTimezoneColumn) {
            return;
        }

        await queryRunner.addColumn(
            this.table,
            new TableColumn({
                name: this.columnName,
                type: 'varchar',
                length: '40',
                isNullable: true,
            }),
        );

        await queryRunner.query(`UPDATE "organisation" set ${this.columnName} = 'Asia/Singapore'`);

        await queryRunner.query(`ALTER TABLE "${this.table}"
        ALTER COLUMN "${this.columnName}" TYPE VARCHAR(40),
        ALTER COLUMN "${this.columnName}" SET NOT NULL,
        ALTER COLUMN "${this.columnName}" SET DEFAULT 'Asia/Singapore'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const hasTimezoneColumn = await queryRunner.hasColumn(this.table, this.columnName);
        if (!hasTimezoneColumn) {
            return;
        }

        await queryRunner.dropColumn(this.table, this.columnName);
    }
}
