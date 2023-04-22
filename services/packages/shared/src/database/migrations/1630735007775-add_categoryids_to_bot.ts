import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCategoryIdsToBot1630735007775 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const hasCategoryIdsCOlumn = await queryRunner.hasColumn('bot', 'category_ids');
        if (hasCategoryIdsCOlumn) {
            return;
        }

        await queryRunner.query('ALTER TABLE bot ADD COLUMN category_ids jsonb;');
        await queryRunner.query('CREATE INDEX bot_category_gin_idx ON bot USING gin ((category_ids) jsonb_path_ops);');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('drop INDEX if exists bot_category_gin_idx');
        await queryRunner.dropColumn('bot', 'category_ids');
    }
}
