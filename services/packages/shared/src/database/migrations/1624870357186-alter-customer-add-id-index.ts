import { MigrationInterface, QueryRunner, TableIndex } from 'typeorm';

export class AlterCustomerAddIdIndex1624870357186 implements MigrationInterface {
    private table = 'customer';
    private column = 'id';
    private searchIndex = 'customer_id_search_index';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createIndex(
            this.table,
            new TableIndex({ columnNames: [this.column], name: this.searchIndex }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropIndex(this.table, this.searchIndex);
        await queryRunner.dropColumn(this.table, this.column);
    }
}
