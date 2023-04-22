import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
import { Util } from '../../helpers';

export class AlterOrganisationAddAddress1628580917901 implements MigrationInterface {
    private table = 'organisation';
    private columns = {
        address: 'address',
    };
    private indexName = 'organisation_address_search_index';
    public async up(queryRunner: QueryRunner): Promise<void> {
        const hasAddressColumn = await queryRunner.hasColumn(this.table, this.columns.address);
        if (hasAddressColumn) {
            return;
        }

        await queryRunner.addColumns(this.table, [
            new TableColumn({
                name: this.columns.address,
                type: 'varchar',
                length: '512',
                isNullable: true,
            }),
        ]);

        await Util.createSearchIndex(queryRunner, this.table, this.indexName, [this.columns.address]);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const hasAddressColumn = await queryRunner.hasColumn(this.table, this.columns.address);
        if (!hasAddressColumn) {
            return;
        }
        await queryRunner.dropColumn(this.table, this.columns.address);
    }
}
