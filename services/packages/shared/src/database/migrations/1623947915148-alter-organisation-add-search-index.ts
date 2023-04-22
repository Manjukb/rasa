import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterOrganisationAddSearchIndex1623947915148 implements MigrationInterface {
    private table = 'organisation';
    private organisationIdSearchIndex = 'organisation_organisation_id';
    private organisationIdColum = 'organisation_id';
    private clientTypeSearchIndex = 'organisation_client_type';
    private clientTypeColum = 'client_type';
    private businessTypeSearchIndex = 'organisation_business_type';
    private businessTypeColum = 'business_type';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createIndex(this.table, {
            name: this.organisationIdSearchIndex,
            columnNames: [this.organisationIdColum],
            clone: undefined,
            isFulltext: true,
            isSpatial: false,
            isUnique: false,
            where: '',
        });

        await queryRunner.createIndex(this.table, {
            name: this.clientTypeSearchIndex,
            columnNames: [this.clientTypeColum],
            clone: undefined,
            isFulltext: true,
            isSpatial: false,
            isUnique: false,
            where: '',
        });

        await queryRunner.createIndex(this.table, {
            name: this.businessTypeSearchIndex,
            columnNames: [this.businessTypeColum],
            clone: undefined,
            isFulltext: true,
            isSpatial: false,
            isUnique: false,
            where: '',
        });
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropIndex(this.table, this.organisationIdSearchIndex);
        await queryRunner.dropIndex(this.table, this.clientTypeSearchIndex);
        await queryRunner.dropIndex(this.table, this.businessTypeSearchIndex);
    }
}
