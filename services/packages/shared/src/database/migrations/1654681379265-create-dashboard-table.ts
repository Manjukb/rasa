import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class createDashboardTable1654681379265 implements MigrationInterface {
    private tableName = 'dashboard';

    private columns = {
        id: 'id',
        organisationId: 'organisation_id',
        organisationName: 'organisation_name',
        rfqId: 'rfq_id',
        rfqCreatedDate: 'rfq_created_date',
        rfqStatus: 'rfq_status',
        rfqSupplierIds: 'rfq_supplier_ids',
        rfqSupplierNames: 'rfq_supplier_names',
        rfqAwardedDate: 'rfq_awarded_date',
        purchaseType: 'purchase_type',
        totalHistoricPrice: 'total_historic_price',
        revisedBaselinePrice: 'revised_baseline_price',
        rfqAwardedPrice: 'rfq_awarded_price',
        totalSavings: 'total_savings',
        winnerSupplierId: 'winner_supplier_id',
        winnerSupplierName: 'winner_supplier_name',
        winnerSupplierCompanyName: 'winner_supplier_company_name',
        productIds: 'product_ids',
        productNames: 'product_names',
        category: 'category',
    };

    public async up(queryRunner: QueryRunner): Promise<void> {
        const hasDashboardTable = await queryRunner.hasTable(this.tableName);
        if (hasDashboardTable) {
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
                        name: this.columns.organisationId,
                        type: 'varchar',
                        isNullable: true,
                        length: '40',
                    },
                    {
                        name: this.columns.organisationName,
                        type: 'varchar',
                        isNullable: true,
                        length: '100',
                    },
                    {
                        name: this.columns.rfqId,
                        type: 'varchar',
                        isNullable: true,
                        length: '40',
                    },
                    {
                        name: this.columns.rfqCreatedDate,
                        type: 'timestamp',
                        isNullable: true,
                    },
                    {
                        name: this.columns.rfqStatus,
                        type: 'varchar',
                        isNullable: true,
                        length: '20',
                    },
                    {
                        name: this.columns.rfqSupplierIds,
                        type: 'jsonb',
                        isNullable: true,
                    },
                    {
                        name: this.columns.rfqSupplierNames,
                        type: 'jsonb',
                        isNullable: true,
                    },
                    {
                        name: this.columns.rfqAwardedDate,
                        type: 'timestamp',
                        isNullable: true,
                    },
                    {
                        name: this.columns.purchaseType,
                        type: 'varchar',
                        isNullable: true,
                        length: '20',
                    },
                    {
                        name: this.columns.totalHistoricPrice,
                        type: 'float',
                        isNullable: true,
                    },
                    {
                        name: this.columns.revisedBaselinePrice,
                        type: 'float',
                        isNullable: true,
                    },
                    {
                        name: this.columns.rfqAwardedPrice,
                        type: 'float',
                        isNullable: true,
                    },
                    {
                        name: this.columns.totalSavings,
                        type: 'float',
                        isNullable: true,
                    },
                    {
                        name: this.columns.winnerSupplierId,
                        type: 'varchar',
                        isNullable: true,
                        length: '40',
                    },
                    {
                        name: this.columns.winnerSupplierName,
                        type: 'varchar',
                        isNullable: true,
                        length: '100',
                    },
                    {
                        name: this.columns.winnerSupplierCompanyName,
                        type: 'varchar',
                        isNullable: true,
                        length: '100',
                    },
                    {
                        name: this.columns.productIds,
                        type: 'jsonb',
                        isNullable: true,
                    },
                    {
                        name: this.columns.productNames,
                        type: 'jsonb',
                        isNullable: true,
                    },
                    {
                        name: this.columns.category,
                        type: 'json',
                        isNullable: true,
                    },
                ],
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const hasDashboardTable = await queryRunner.hasTable(this.tableName);
        if (!hasDashboardTable) {
            return;
        }
        await queryRunner.dropTable(this.tableName);
    }
}
