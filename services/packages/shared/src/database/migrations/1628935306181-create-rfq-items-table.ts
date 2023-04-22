import { MigrationInterface, QueryRunner, Table } from 'typeorm';
import { UomType } from '../../enum';
import { Util } from '../../helpers';

export class CreateRfqItemsTable1628935306181 implements MigrationInterface {
    private tableName = 'rfq_item';

    // search index
    private rfqIdSearchIndex = 'rfq_item_rfq_id_search_index';
    private productIdSearchIndex = 'rfq_item_product_id_search_index';

    // foreign key index
    private createdByForeignKeyIndex = 'rfq_item_creator';
    private updatedByForeignKeyIndex = 'rfq_item_updater';
    private rfqIdForeignKeyIndex = 'rfq_item_rfq_id';
    private productIdForeignKeyIndex = 'rfq_item_product_id';

    // ref tables
    private userRefTable = 'user';
    private rfqRefTable = 'rfq';
    private productRefTable = 'product';

    //ref columns
    private userRefColumn = 'user_id';
    private rfqIdRefColumn = 'id';
    private productIdRefColumn = 'id';

    private columns = {
        id: 'id',
        rfqId: 'rfq_id',
        productId: 'product_id',
        baselinePrice: 'baseline_price',
        baselineQuantity: 'baseline_quantity',
        uom: 'uom',
        isQuantityNegotiable: 'is_quantity_negotiable',
        createdBy: 'created_by',
        updatedBy: 'updated_by',
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
                        name: this.columns.rfqId,
                        type: 'varchar',
                        isNullable: false,
                        length: '40',
                    },
                    {
                        name: this.columns.productId,
                        type: 'varchar',
                        isNullable: false,
                        length: '40',
                    },
                    {
                        name: this.columns.baselinePrice,
                        type: 'integer',
                        isNullable: false,
                        // length: '10',
                    },
                    {
                        name: this.columns.baselineQuantity,
                        type: 'integer',
                        isNullable: false,
                        // length: '10',
                    },
                    {
                        name: this.columns.uom,
                        type: 'enum',
                        isNullable: false,
                        enum: [UomType.box, UomType.pack, UomType.pieces],
                    },
                    {
                        name: this.columns.isQuantityNegotiable,
                        type: 'boolean',
                        isNullable: false,
                        default: false,
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
                    {
                        name: this.columns.createdBy,
                        type: 'varchar',
                        isNullable: false,
                        length: '40',
                    },
                    {
                        name: this.columns.updatedBy,
                        type: 'varchar',
                        isNullable: false,
                        length: '40',
                    },
                ],
            }),
        );

        await Util.createSearchIndex(queryRunner, this.tableName, this.rfqIdSearchIndex, [this.columns.rfqId]);
        await Util.createSearchIndex(queryRunner, this.tableName, this.productIdSearchIndex, [this.columns.productId]);

        await Util.createForeignKey(
            queryRunner,
            this.tableName,
            this.createdByForeignKeyIndex,
            [this.columns.createdBy],
            this.userRefTable,
            [this.userRefColumn],
        );

        await Util.createForeignKey(
            queryRunner,
            this.tableName,
            this.updatedByForeignKeyIndex,
            [this.columns.updatedBy],
            this.userRefTable,
            [this.userRefColumn],
        );

        await Util.createForeignKey(
            queryRunner,
            this.tableName,
            this.rfqIdForeignKeyIndex,
            [this.columns.rfqId],
            this.rfqRefTable,
            [this.rfqIdRefColumn],
        );

        await Util.createForeignKey(
            queryRunner,
            this.tableName,
            this.productIdForeignKeyIndex,
            [this.columns.productId],
            this.productRefTable,
            [this.productIdRefColumn],
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const hasCategoryTable = await queryRunner.hasTable(this.tableName);
        if (!hasCategoryTable) {
            return;
        }
        await queryRunner.dropTable(this.tableName);
    }
}
