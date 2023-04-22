import { MigrationInterface, QueryRunner, TableColumn, getRepository } from 'typeorm';

import { MailQueue } from '../models';

export class alterMailQueue1639565093433 implements MigrationInterface {
    private tableName = 'mail_queue';
    private columns = {
        type: 'type',
        sendAt: 'send_at',
    };
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "mail_queue"
        ALTER COLUMN "rfq_id" DROP NOT NULL`);

        const hasTypeColumn = await queryRunner.hasColumn(this.tableName, this.columns.type);
        const hasSendAtColumn = await queryRunner.hasColumn(this.tableName, this.columns.sendAt);
        if (hasTypeColumn || hasSendAtColumn) {
            return;
        }

        await queryRunner.addColumn(
            this.tableName,
            new TableColumn({
                name: this.columns.type,
                type: 'varchar',
                isNullable: true,
                length: '56',
            }),
        );

        await queryRunner.addColumn(
            this.tableName,
            new TableColumn({
                name: this.columns.sendAt,
                type: 'timestamptz',
                isNullable: true,
            }),
        );

        const mailQueues = await queryRunner.manager
            .createQueryBuilder()
            .from(MailQueue, 'mail_queue')
            .select(['mail_queue.id'])
            .getMany();

        mailQueues.forEach(
            async (mailQueue: MailQueue): Promise<void> => {
                await getRepository(MailQueue).update({ id: mailQueue.id }, { type: 'RFQOpened' });
            },
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const hasTypeColumn = await queryRunner.hasColumn(this.tableName, this.columns.type);
        const hasSendAtColumn = await queryRunner.hasColumn(this.tableName, this.columns.sendAt);
        if (hasTypeColumn) {
            await queryRunner.dropColumn(this.tableName, this.columns.type);
        }
        if (hasSendAtColumn) {
            await queryRunner.dropColumn(this.tableName, this.columns.sendAt);
        }
    }
}
