import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterUserAddSearchIndex1623929228242 implements MigrationInterface {
    private table = 'user';
    private userIdSearchIndex = 'user_user_id';
    private userIdColum = 'user_id';
    private emailSearchIndex = 'user_email';
    private emailColum = 'email';
    private organisationIdSearchIndex = 'user_organisation_id';
    private organisationIdColum = 'organisation_id';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createIndex(this.table, {
            name: this.userIdSearchIndex,
            columnNames: [this.userIdColum],
            clone: undefined,
            isFulltext: true,
            isSpatial: false,
            isUnique: false,
            where: '',
        });

        await queryRunner.createIndex(this.table, {
            name: this.emailSearchIndex,
            columnNames: [this.emailColum],
            clone: undefined,
            isFulltext: true,
            isSpatial: false,
            isUnique: false,
            where: '',
        });
        await queryRunner.createIndex(this.table, {
            name: this.organisationIdSearchIndex,
            columnNames: [this.organisationIdColum],
            clone: undefined,
            isFulltext: true,
            isSpatial: false,
            isUnique: false,
            where: '',
        });
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropIndex(this.table, this.userIdSearchIndex);
        await queryRunner.dropIndex(this.table, this.emailSearchIndex);
        await queryRunner.dropIndex(this.table, this.organisationIdSearchIndex);
    }
}
