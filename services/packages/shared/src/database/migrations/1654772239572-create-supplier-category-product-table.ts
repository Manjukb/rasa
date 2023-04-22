import { MigrationInterface, QueryRunner, Table } from 'typeorm';
import { Supplier, SupplierCategoryProduct } from '../..';

import { Util } from '../../helpers';

export class createSupplierCategoryProductTable1654772239572 implements MigrationInterface {
    private tableName = 'supplier_category_product';

    private columns = {
        id: 'id',
        supplierId: 'supplier_id',
        categoryIds: 'category_ids',
        subCategoryIds: 'sub_category_ids',
        productIds: 'product_ids',
        createdDate: 'created_date',
        updatedDate: 'updated_date',
    };

    public async up(queryRunner: QueryRunner): Promise<void> {
        const hasSupplierCategoryProductTable = await queryRunner.hasTable(this.tableName);
        if (hasSupplierCategoryProductTable) {
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
                        name: this.columns.supplierId,
                        type: 'varchar',
                        isNullable: true,
                        length: '40',
                    },
                    {
                        name: this.columns.categoryIds,
                        type: 'jsonb',
                        isNullable: true,
                    },
                    {
                        name: this.columns.subCategoryIds,
                        type: 'jsonb',
                        isNullable: true,
                    },
                    {
                        name: this.columns.productIds,
                        type: 'jsonb',
                        isNullable: true,
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

        const suppliers = await queryRunner.manager.getRepository(Supplier).createQueryBuilder('supplier').getMany();

        await Promise.all(
            (suppliers || []).map(
                async (supplier: Supplier): Promise<void> => {
                    const supplierCategoryProduct = {
                        id: Util.guid(),
                        supplier_id: supplier.id,
                        created_date: supplier.created_date,
                        update_date: supplier.created_date,
                    };
                    await queryRunner.manager.getRepository(SupplierCategoryProduct).save(supplierCategoryProduct);
                },
            ),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const hasSupplierCategoryProductTable = await queryRunner.hasTable(this.tableName);
        if (!hasSupplierCategoryProductTable) {
            return;
        }
        await queryRunner.dropTable(this.tableName);
    }
}
