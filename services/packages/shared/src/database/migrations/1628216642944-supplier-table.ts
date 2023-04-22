import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class SupplierTable1628216642944 implements MigrationInterface {
    private tableName = 'supplier';

    // search index
    private emailSearchIndex = 'supplier_email_search_index';
    private nameSearchIndex = 'supplier_name_search_index';
    private activeSearchIndex = 'supplier_active_search_index';
    private phoneSearchIndex = 'supplier_phone_search_index';

    private columns = {
        id: 'id',
        name: 'name',
        email: 'email',
        phone: 'phone',
        password: 'password_hash',
        passwordKey: 'password_key',
        isActive: 'is_active',
        createdDate: 'created_date',
        updatedDate: 'updated_date',
    };

    private async createSearchIndex(queryRunner: QueryRunner, name: string, columnNames: string[]): Promise<void> {
        await queryRunner.createIndex(this.tableName, {
            name,
            columnNames,
            clone: undefined,
            isFulltext: true,
            isSpatial: false,
            isUnique: false,
            where: '',
        });
    }

    public async up(queryRunner: QueryRunner): Promise<void> {
        const hasSupplierTable = await queryRunner.hasTable(this.tableName);
        if (hasSupplierTable) {
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
                        name: this.columns.name,
                        type: 'varchar',
                        isNullable: false,
                        length: '40',
                    },
                    {
                        name: this.columns.email,
                        type: 'varchar',
                        isNullable: false,
                        length: '40',
                        isUnique: true,
                    },
                    {
                        name: this.columns.phone,
                        type: 'varchar',
                        isNullable: false,
                        length: '15',
                        // isUnique: true,
                    },
                    {
                        name: this.columns.password,
                        type: 'varchar',
                        isNullable: false,
                        length: '128',
                    },
                    {
                        name: this.columns.passwordKey,
                        type: 'varchar',
                        isNullable: true,
                        length: '40',
                    },
                    {
                        name: this.columns.isActive,
                        type: 'boolean',
                        isNullable: false,
                        default: true,
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

        await this.createSearchIndex(queryRunner, this.nameSearchIndex, [this.columns.name]);
        await this.createSearchIndex(queryRunner, this.emailSearchIndex, [this.columns.email]);
        await this.createSearchIndex(queryRunner, this.activeSearchIndex, [this.columns.isActive]);
        await this.createSearchIndex(queryRunner, this.phoneSearchIndex, [this.columns.phone]);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const hasSupplierTable = await queryRunner.hasTable(this.tableName);
        if (!hasSupplierTable) {
            return;
        }
        await queryRunner.dropTable(this.tableName);
    }
}
