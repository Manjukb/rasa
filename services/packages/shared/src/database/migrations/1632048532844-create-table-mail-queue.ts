import { MigrationInterface, QueryRunner, Table } from 'typeorm';
import { Util } from '../..';

export class CreateTableMailQueue1632048532844 implements MigrationInterface {
    private tableName = 'mail_queue';
    private columns = {
        id: 'id',
        rfqId: 'rfq_id',
        message: 'message',
        lastSentTime: 'last_sent_time',
        createdDate: 'created_date',
    };

    // search index
    private rfqIdSearchIndex = 'mail_queue_rfq_id_search_index';

    // foreign key index
    private rfqIdForeignKeyIndex = 'mail_queue_rfq_id';

    // ref tables
    private rfqRefTable = 'rfq';

    //ref columns
    private rfqRefColumn = 'id';

    public async up(queryRunner: QueryRunner): Promise<void> {
        const hasTable = await queryRunner.hasTable(this.tableName);
        if (hasTable) {
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
                        isUnique: true,
                        length: '40',
                    },
                    {
                        name: this.columns.message,
                        type: 'jsonb',
                    },
                    {
                        name: this.columns.lastSentTime,
                        type: 'timestamp',
                        isNullable: true,
                    },

                    {
                        name: this.columns.createdDate,
                        type: 'timestamp',
                        default: 'now()',
                    },
                ],
            }),
        );
        await Util.createSearchIndex(queryRunner, this.tableName, this.rfqIdSearchIndex, [this.columns.rfqId]);

        await Util.createForeignKey(
            queryRunner,
            this.tableName,
            this.rfqIdForeignKeyIndex,
            [this.columns.rfqId],
            this.rfqRefTable,
            [this.rfqRefColumn],
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable(this.tableName, true);
    }
}
