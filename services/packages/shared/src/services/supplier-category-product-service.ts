import { ResponseViewModel, SuccessResponse } from './..';

import { SupplierCategoryProduct } from '../database/models';
import { Util } from '../helpers';
import { getRepository } from 'typeorm';
import { injectable } from 'inversify';

export interface SupplierCategoryProductServiceContract {
    getOrCreate(supplierId: string, request: any): Promise<ResponseViewModel<SuccessResponse>>;
    getSupplierCategoryProductBySupplierIds(supplierIds: string[]): Promise<SupplierCategoryProduct[]>;
}

@injectable()
export class SupplierCategoryProductService implements SupplierCategoryProductServiceContract {
    public async getOrCreate(supplierId: string, request: any): Promise<ResponseViewModel<SuccessResponse>> {
        const supplierCategoryProduct = await getRepository(SupplierCategoryProduct).findOne({
            supplier_id: supplierId,
        });

        const id = supplierCategoryProduct ? supplierCategoryProduct.id : Util.guid();
        const newSupplierCategoryProduct = {
            id,
            supplier_id: supplierId,
            category_ids: request.category_ids ? request.category_ids : null,
            sub_category_ids: request.sub_category_ids ? request.sub_category_ids : null,
            product_ids: request.product_ids ? request.product_ids : null,
        };
        await getRepository(SupplierCategoryProduct).save(newSupplierCategoryProduct);
        return ResponseViewModel.withSuccess();
    }

    public async getSupplierCategoryProductBySupplierIds(supplierIds: string[]): Promise<SupplierCategoryProduct[]> {
        const supplierCategoryProduct = await getRepository(SupplierCategoryProduct)
            .createQueryBuilder('supplier_category_product')
            .where('supplier_category_product.supplier_id IN (:...ids)', {
                ids: supplierIds.length ? supplierIds : [''],
            })
            .getMany();
        return supplierCategoryProduct;
    }
}
