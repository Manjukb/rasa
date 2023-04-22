import { QueryRunner, getRepository } from 'typeorm';

import { ResponseViewModel } from '../viewmodels/response-viewmodel';
import { RfqSupplier } from '../database/models';
import { injectable, inject } from 'inversify';
import { RfqSupplierType } from '../types';
import { RfqRequest, Util } from '..';
import { SupplierUserServiceContract } from '.';
import { SuccessResponse } from '../viewmodels/response';

export interface RfqSupplierServiceContract {
    create(
        queryRunner: QueryRunner,
        suppliers: RfqSupplierType[],
        rfqId: string,
    ): Promise<ResponseViewModel<SuccessResponse>>;
    getSuppliers(rfqIds: string[]): Promise<RfqSupplier[]>;
    getRfqIdsBySupplierIds(supplierIds: string[]): Promise<string[]>;
    getSupplierIdByRFQAndUserId(userId: string, rfqId: string): Promise<ResponseViewModel<string>>;
    deleteByRfqID(rfqId: string): Promise<void>;
}

@injectable()
export class RfqSupplierService implements RfqSupplierServiceContract {
    public constructor(
        @inject('SupplierUserService') private readonly supplierUserService: SupplierUserServiceContract,
    ) {}
    public async create(
        queryRunner: QueryRunner,
        suppliers: RfqSupplierType[],
        rfqId: string,
    ): Promise<ResponseViewModel<SuccessResponse>> {
        await this.deleteByRfqId(rfqId, queryRunner);
        const uniqueSuppliers = suppliers.reduce((accumulator, current) => {
            if (!accumulator.find((s) => s.id === current.id)) {
                accumulator.push(current);
            }
            return accumulator;
        }, []);

        await Util.allSettled(
            uniqueSuppliers.map(
                async (supplier: RfqSupplierType): Promise<void> => {
                    const rfqSupplier = RfqRequest.toRfqSupplierModel(supplier, rfqId, null);
                    await this.save(rfqSupplier, queryRunner);
                },
            ),
        );

        return ResponseViewModel.withSuccess();
    }

    public async save(supplier: RfqSupplier, queryRunner: QueryRunner): Promise<void> {
        await queryRunner.manager.save(supplier);
    }

    public async deleteByRfqId(rfqId: string, queryRunner: QueryRunner): Promise<void> {
        await queryRunner.manager.delete(RfqSupplier, { rfq_id: rfqId });
    }

    public async getSuppliers(rfqIds: string[]): Promise<RfqSupplier[]> {
        const suppliers = await getRepository(RfqSupplier)
            .createQueryBuilder()
            .where('rfq_id in (:...rfqIds)', { rfqIds: rfqIds.length ? rfqIds : [''] })
            .getMany();

        return suppliers;
    }

    public async getRfqIdsBySupplierIds(supplierIds: string[]): Promise<string[]> {
        const rfqSuppliers = await getRepository(RfqSupplier)
            .createQueryBuilder()
            .where('supplier_id in (:...supplierIds)', { supplierIds: supplierIds.length ? supplierIds : [''] })
            .getMany();
        const rfqIds = rfqSuppliers.map((rfqSupplier) => rfqSupplier.rfq_id);

        return [...new Set(rfqIds)];
    }

    public async getSupplierIdByRFQAndUserId(userId: string, rfqId: string): Promise<ResponseViewModel<string>> {
        const rfqSuppliers = await this.getSuppliers([rfqId]);
        const rfqSupplierIds = rfqSuppliers.map((s) => s.supplier_id);
        const userSupplerIds = await this.supplierUserService.getSuppliersIdsByUserId(userId);

        const supplierIds = userSupplerIds.filter((userSupplerId) => rfqSupplierIds.includes(userSupplerId));
        if (!supplierIds.length) {
            return ResponseViewModel.withError('unable to get supplier Id');
        }
        return ResponseViewModel.with(supplierIds[0]);
    }

    public async deleteByRfqID(rqfId: string): Promise<void> {
        await getRepository(RfqSupplier).delete({ rfq_id: rqfId });
    }
}
