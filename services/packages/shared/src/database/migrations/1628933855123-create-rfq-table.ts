import { MigrationInterface, QueryRunner, Table } from 'typeorm';
import { Util } from '../../helpers';

export class CreateRfqTable1628933855123 implements MigrationInterface {
    private tableName = 'rfq';

    // search index
    private winnerSearchIndex = 'rfq_winner_search_index';
    private statusSearchIndex = 'rfq_status_search_index';
    private createdBySearchIndex = 'rfq_created_by_search_index';
    private organisationIdSearchIndex = 'rfq_organisation_id_search_index';

    // foreign key index
    private createdByForeignKeyIndex = 'rfq_creator';
    private updatedByForeignKeyIndex = 'rfq_updater';
    private winner_supplierForeignKeyIndex = 'rfq_winner_supplier';
    private organisationIdForeignKeyIndex = 'rfq_organisation';

    // ref tables
    private userRefTable = 'user';
    private organistaionRefTable = 'organisation';

    //ref columns
    private userRefColumn = 'user_id';
    private organisationRefColumn = 'organisation_id';

    private columns = {
        id: 'id',
        organisationId: 'organisation_id',
        targetSavingRate: 'target_saving_rate',
        paymentTerms: 'payment_terms',
        contractTerms: 'contract_terms',
        winnerSupplier: 'winner_supplier_id',
        status: 'status',
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
                        name: this.columns.organisationId,
                        type: 'varchar',
                        isNullable: false,
                        length: '40',
                    },
                    {
                        name: this.columns.targetSavingRate,
                        type: 'int2',
                        isNullable: false,
                    },
                    {
                        name: this.columns.paymentTerms,
                        type: 'json',
                        isNullable: false,
                    },
                    {
                        name: this.columns.contractTerms,
                        type: 'json',
                        isNullable: false,
                    },
                    {
                        name: this.columns.winnerSupplier,
                        type: 'varchar',
                        isNullable: true,
                        length: '40',
                    },
                    {
                        name: this.columns.status,
                        type: 'varchar',
                        isNullable: true,
                        length: '40',
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

        await Util.createSearchIndex(queryRunner, this.tableName, this.winnerSearchIndex, [
            this.columns.winnerSupplier,
        ]);
        await Util.createSearchIndex(queryRunner, this.tableName, this.statusSearchIndex, [this.columns.status]);
        await Util.createSearchIndex(queryRunner, this.tableName, this.organisationIdSearchIndex, [
            this.columns.organisationId,
        ]);
        await Util.createSearchIndex(queryRunner, this.tableName, this.createdBySearchIndex, [this.columns.createdBy]);

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
            this.organisationIdForeignKeyIndex,
            [this.columns.organisationId],
            this.organistaionRefTable,
            [this.organisationRefColumn],
        );

        await Util.createForeignKey(
            queryRunner,
            this.tableName,
            this.winner_supplierForeignKeyIndex,
            [this.columns.winnerSupplier],
            this.organistaionRefTable,
            [this.organisationRefColumn],
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
