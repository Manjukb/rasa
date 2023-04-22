import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterProductDropColumnProductid1631242509339 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const hasColumn = await queryRunner.hasColumn('product', 'product_id');
        if (!hasColumn) {
            return;
        }

        await queryRunner.dropColumn('product', 'product_id');
    }

    public async down(): Promise<void> {
        console.warn('no need to add product_id column again');
    }
}
