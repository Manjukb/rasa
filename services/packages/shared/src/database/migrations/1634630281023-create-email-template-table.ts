import { MigrationInterface, QueryRunner, Table } from 'typeorm';

import { TemplateType } from '../../enum/template-type';
import { Util } from '../../helpers';

export class createEmailTemplateTable1634630281023 implements MigrationInterface {
    private tableName = 'email_template';

    // search index
    private organisationIdSearchIndex = 'email_organisation_id_search_index';

    // foreign key index
    private organisationIdForeignKeyIndex = 'email_organisation';

    // ref tables
    private organistaionRefTable = 'organisation';

    //ref columns
    private organisationRefColumn = 'organisation_id';

    private columns = {
        id: 'id',
        organisationId: 'organisation_id',
        templateType: 'template_type',
        subject: 'subject',
        message: 'message',
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
                        isNullable: true,
                        length: '40',
                    },
                    {
                        name: this.columns.templateType,
                        type: 'enum',
                        isNullable: false,
                        enum: [TemplateType.RFQInvitation],
                    },
                    {
                        name: this.columns.subject,
                        type: 'varchar',
                        length: '100',
                    },
                    {
                        name: this.columns.message,
                        type: 'text',
                    },
                ],
            }),
        );

        await Util.createSearchIndex(queryRunner, this.tableName, this.organisationIdSearchIndex, [
            this.columns.organisationId,
        ]);

        await Util.createForeignKey(
            queryRunner,
            this.tableName,
            this.organisationIdForeignKeyIndex,
            [this.columns.organisationId],
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
