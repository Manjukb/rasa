import { MigrationInterface, QueryRunner } from 'typeorm';
import { Supplier, SupplierCompany, Util } from '../..';

export class alterSupplierTableAddCompanyId1655459490577 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const allSuppliers = await queryRunner.manager.getRepository(Supplier).createQueryBuilder('supplier').getMany();
        allSuppliers.forEach(
            async (supplier: Supplier): Promise<void> => {
                const supplierCompany = {
                    id: Util.guid(),
                    name: supplier.name,
                    address: supplier.address,
                    is_active: supplier.is_active,
                    created_date: supplier.created_date,
                    updated_date: supplier.updated_date,
                };
                await queryRunner.manager.getRepository(SupplierCompany).insert(supplierCompany);
                await queryRunner.manager
                    .getRepository(Supplier)
                    .update({ id: supplier.id }, { supplier_company_id: supplierCompany.id });
            },
        );
    }

    public async down(): Promise<void> {
        console.warn('no need to update "supplier" again');
    }
}
