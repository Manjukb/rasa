import { QueryRunner, getRepository } from 'typeorm';

import { ResponseViewModel } from '../viewmodels/response-viewmodel';
import { RfqItem } from '../database/models';
import { RfqItemType } from '../types';
import { RfqRequest, Util } from '..';
import { SuccessResponse } from '../viewmodels/response';
import { injectable } from 'inversify';

export interface RfqItemServiceContract {
    create(
        queryRunner: QueryRunner,
        items: RfqItemType[],
        rfqId: string,
        userId: string,
    ): Promise<ResponseViewModel<SuccessResponse>>;
    deleteByRfqID(rfqId: string): Promise<void>;
    getRfqItems(rfqIds: string[]): Promise<RfqItem[]>;
}

@injectable()
export class RfqItemService implements RfqItemServiceContract {
    public async create(
        queryRunner: QueryRunner,
        items: RfqItemType[],
        rfqId: string,
        userId: string,
    ): Promise<ResponseViewModel<SuccessResponse>> {
        await this.deleteByRfqId(rfqId, queryRunner);
        const results = await Util.allSettled(
            items.map((item) => this.save(RfqRequest.toRfqItemModel(item, rfqId, userId), queryRunner)),
        );
        const hasErrors = results.some((a) => a.status === 'rejected');
        if (hasErrors) {
            const e = results.find((a) => a.status === 'rejected').reason;
            if (e instanceof Error) {
                throw e;
            }
            throw new Error(e);
        }
        return ResponseViewModel.withSuccess();
    }

    public async save(rfqItem: RfqItem, queryRunner: QueryRunner): Promise<void> {
        await queryRunner.manager.save(rfqItem);
    }

    public async deleteByRfqId(rfqId: string, queryRunner: QueryRunner): Promise<void> {
        await queryRunner.manager.delete(RfqItem, { rfq_id: rfqId });
        // await getRepository(RfqItem).delete({ rfq_id: rfqId });
    }

    public async getRfqItems(rfqIds: string[]): Promise<RfqItem[]> {
        const items = await getRepository(RfqItem)
            .createQueryBuilder()
            .where('rfq_id in (:...rfqIds)', { rfqIds: rfqIds.length ? rfqIds : '' })
            .getMany();

        return items;
    }

    public async deleteByRfqID(rqfId: string): Promise<void> {
        await getRepository(RfqItem).delete({ rfq_id: rqfId });
    }
}
