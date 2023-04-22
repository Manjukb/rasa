import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterNegotiationAddSearchIndex1623947725218 implements MigrationInterface {
    private table = 'negotiation';
    private channelIdSearchIndex = 'negotiation_channel_id';
    private channelIdColum = 'channel_id';
    private statusSearchIndex = 'negotiation_status';
    private statusColum = 'status';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createIndex(this.table, {
            name: this.channelIdSearchIndex,
            columnNames: [this.channelIdColum],
            clone: undefined,
            isFulltext: true,
            isSpatial: false,
            isUnique: false,
            where: '',
        });

        await queryRunner.createIndex(this.table, {
            name: this.statusSearchIndex,
            columnNames: [this.statusColum],
            clone: undefined,
            isFulltext: true,
            isSpatial: false,
            isUnique: false,
            where: '',
        });
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropIndex(this.table, this.channelIdSearchIndex);
        await queryRunner.dropIndex(this.table, this.statusSearchIndex);
    }
}
