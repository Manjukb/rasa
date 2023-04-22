import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

import { Bot } from '../..';

export class alterBotAddIsDefaultColumn1642585901487 implements MigrationInterface {
    private tableName = 'bot';
    private column = 'is_default';
    public async up(queryRunner: QueryRunner): Promise<void> {
        const hasIsDefaultColumn = await queryRunner.hasColumn(this.tableName, this.column);
        if (hasIsDefaultColumn) {
            return;
        }
        await queryRunner.addColumn(
            this.tableName,
            new TableColumn({
                name: this.column,
                type: 'bit',
                isNullable: true,
            }),
        );

        const bots = await queryRunner.manager
            .createQueryBuilder()
            .from(Bot, 'bot')
            .select(['bot.category_ids', 'bot.id'])
            .getMany();

        (bots || []).forEach(
            async (bot: Bot): Promise<void> => {
                const isDefault = bot.category_ids === null || bot.category_ids.length ? 0 : 1;
                await queryRunner.manager
                    .createQueryBuilder()
                    .update(Bot)
                    .set({ is_default: isDefault })
                    .where({ id: bot.id })
                    .execute();
            },
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const hasIsDefaultColumn = await queryRunner.hasColumn(this.tableName, this.column);
        if (hasIsDefaultColumn) {
            await queryRunner.dropColumn(this.tableName, this.column);
        }
    }
}
