import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterCategoryDropBusinessTypeColumn1627544401190 implements MigrationInterface {
    private table = 'category';
    private column = 'business_type';
    public async up(queryRunner: QueryRunner): Promise<void> {
        const hasColumn = await queryRunner.hasColumn(this.table, this.column);
        hasColumn && (await queryRunner.dropColumn(this.table, this.column));
    }

    public async down(): Promise<void> {
        // nothing to do
    }
}
