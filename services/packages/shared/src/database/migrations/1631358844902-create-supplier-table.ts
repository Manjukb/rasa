import { MigrationInterface, QueryRunner, Table } from 'typeorm';

import { Util } from '../..';

export class CreateSupplierTable1631358844902 implements MigrationInterface {
    private tableName = 'supplier';

    // search index
    private supplierNameSearchIndex = 'supplier_name_search_index';

    private columns = {
        id: 'id',
        name: 'name',
        address: 'address',
        isActive: 'is_active',
        createdDate: 'created_date',
        updatedDate: 'updated_date',
    };

    public async up(queryRunner: QueryRunner): Promise<void> {
        const hasCategoryTable = await queryRunner.hasTable(this.tableName);
        if (hasCategoryTable) {
            return;
        }

        await queryRunner.createTable(
            new Table({
                name: this.tableName,
                columns: [
                    {
                        name: this.columns.id,
                        type: 'varchar',
                        isPrimary: true,
                        length: '40',
                    },
                    {
                        name: this.columns.name,
                        type: 'varchar',
                        isNullable: false,
                        length: '40',
                    },
                    {
                        name: this.columns.address,
                        type: 'text',
                        isNullable: false,
                    },
                    {
                        name: this.columns.isActive,
                        type: 'boolean',
                        default: true,
                    },
                    {
                        name: this.columns.createdDate,
                        type: 'timestamp',
                        default: 'now()',
                    },
                    {
                        name: this.columns.updatedDate,
                        type: 'timestamp',
                        default: 'now()',
                    },
                ],
            }),
        );

        await Util.createSearchIndex(queryRunner, this.tableName, this.supplierNameSearchIndex, [this.columns.name]);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const hasCategoryTable = await queryRunner.hasTable(this.tableName);
        if (!hasCategoryTable) {
            return;
        }
        await queryRunner.dropTable(this.tableName);
    }
}
