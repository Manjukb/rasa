import { MigrationInterface, QueryRunner, TableColumn, getRepository } from 'typeorm';

import { Rfq } from '../models';

export class alterRfqAddLaunchDateColumn1637305631558 implements MigrationInterface {
    private table = 'rfq';
    private column = 'launch_date';

    public async up(queryRunner: QueryRunner): Promise<void> {
        const hasLaunchDateColumn = await queryRunner.hasColumn(this.table, this.column);
        if (hasLaunchDateColumn) {
            return;
        }
        await queryRunner.addColumn(
            this.table,
            new TableColumn({
                name: this.column,
                type: 'timestamptz',
                isNullable: true,
            }),
        );

        const rfqs = await queryRunner.manager
            .createQueryBuilder()
            .from(Rfq, 'rfq')
            .select(['rfq.negotiation_process', 'rfq.id'])
            .getMany();

        rfqs.forEach(
            async (rfq: Rfq): Promise<void> => {
                if (rfq.negotiation_process !== null) {
                    await getRepository(Rfq).update(
                        { id: rfq.id },
                        { launch_date: rfq.negotiation_process.launch_date },
                    );
                }
            },
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const hasColumn = await queryRunner.hasColumn(this.table, this.column);
        if (hasColumn) {
            await queryRunner.dropColumn(this.table, this.column);
        }
    }
}
