import { CommentResponse, RequestUserResponse, SuccessResponse } from '../viewmodels/response';
import { injectable, inject } from 'inversify';
import { ResponseViewModel } from '../viewmodels/response-viewmodel';
import { RfqServiceContract, RfqItemServiceContract } from '.';
import { getRepository } from 'typeorm';
import { Negotiation, Rfq } from '../database/models';
import { RfqSupplierType } from '../types';
import { Constant } from '../helpers';
import { RfqSupplierServiceContract } from './rfq-supplier-service';
import { Roles } from '../enum';
import { RfqStatus } from '../enum/rfq-status';
import { eventSink, RfqRequest } from '..';

export interface RfqNegotiationActionsServiceContract {
    awardRfq(
        rfqId: string,
        supplierId: string,
        user?: RequestUserResponse,
    ): Promise<ResponseViewModel<SuccessResponse>>;
    acceptRfq(
        rfqId: string,
        supplierId: string,
        user?: RequestUserResponse,
    ): Promise<ResponseViewModel<SuccessResponse>>;
    rejectRfq(
        rfqId: string,
        supplierId: string,
        reason: string,
        user?: RequestUserResponse,
    ): Promise<ResponseViewModel<SuccessResponse>>;
    cloneRfq(rfqId: string, user?: RequestUserResponse): Promise<ResponseViewModel<SuccessResponse>>;
    exitRfq(rfqId: string, user?: RequestUserResponse): Promise<ResponseViewModel<SuccessResponse>>;

    addComment(
        rfqId: string,
        payload: Record<string, unknown>,
        user?: RequestUserResponse,
    ): Promise<ResponseViewModel<SuccessResponse | CommentResponse>>;
}

@injectable()
export class RfqNegotiationActionsService implements RfqNegotiationActionsServiceContract {
    public constructor(
        @inject('RfqItemService') private readonly rfqItemService: RfqItemServiceContract,
        @inject('RfqService') private readonly rfqService: RfqServiceContract,
        @inject('RfqSupplierService') private readonly rfqSupplierService: RfqSupplierServiceContract,
    ) {}

    public async exitRfq(rfqId: string, user?: RequestUserResponse): Promise<ResponseViewModel<SuccessResponse>> {
        const rfq = (await this.rfqService.getById(rfqId, user)).data;
        if (!rfq) {
            return ResponseViewModel.withError('rfq-id is incorrect');
        }
        const ifNotActiveRfq = rfq && rfq.status !== 'active';
        if (ifNotActiveRfq) {
            return ResponseViewModel.withError('only active rfq can be exited');
        }

        await getRepository(Rfq)
            .createQueryBuilder('rfq')
            .update(Rfq)
            .set({ status: RfqStatus.completed, updated_date: new Date() })
            .where({ id: rfqId })
            .execute();
        eventSink.raiseEvent(Constant.PMEvents.onRfqExit, [rfqId, user]);
        return ResponseViewModel.withSuccess(true);
    }
    public async awardRfq(
        rfqId: string,
        supplierId: string,
        user?: RequestUserResponse,
    ): Promise<ResponseViewModel<SuccessResponse>> {
        const rfq = (await this.rfqService.getById(rfqId, user)).data;
        if (!rfq) {
            return ResponseViewModel.withError('rfq-id is incorrect');
        }
        const hasSupplierId = rfq.suppliers.some((e) => e.id === supplierId);
        if (!hasSupplierId) {
            return ResponseViewModel.withError('Supplier id is not part of this rfq');
        }

        let rfqStatus = rfq.status === RfqStatus.awarded;
        if (rfqStatus) {
            return ResponseViewModel.withError('Awarded RFQ cannot be awarded again');
        }

        rfqStatus = rfq.status === RfqStatus.awardrequested;
        if (rfqStatus) {
            return ResponseViewModel.withError('Award Requested RFQ cannot be awarded again');
        }

        await getRepository(Rfq)
            .createQueryBuilder('rfq')
            .update(Rfq)
            .set({ winner_supplier_id: supplierId, status: RfqStatus.awardrequested, updated_date: new Date() })
            .where({ id: rfqId })
            .execute();
        eventSink.raiseEvent(Constant.RfqStatus.awardrequested, [rfqId, user]);
        return ResponseViewModel.withSuccess(true);
    }
    public async acceptRfq(
        rfqId: string,
        supplierId: string,
        user?: RequestUserResponse,
    ): Promise<ResponseViewModel<SuccessResponse>> {
        const rfq = (await this.rfqService.getById(rfqId, user)).data;
        if (!rfq) {
            return ResponseViewModel.withError('rfq-id is incorrect');
        }
        const hasSupplierId = rfq.suppliers.some((e) => e.id === supplierId);

        if (!hasSupplierId) {
            return ResponseViewModel.withError('Supplier id is not part of this rfq');
        }

        await getRepository(Rfq)
            .createQueryBuilder('rfq')
            .update(Rfq)
            .set({
                winner_supplier_id: supplierId,
                status: RfqStatus.awarded,
                updated_date: new Date(),
            })
            .where({ id: rfqId })
            .execute();
        const negotiation = await getRepository(Negotiation).findOne({ rfq_id: rfqId });
        if (!negotiation.session.rfq_history) negotiation.session.rfq_history = [];
        negotiation.session.rfq_history.push({
            reason: 'accepted',
            action: Constant.RfqAwardStatus.accepted,
            round: negotiation.round,
            at: new Date(),
            by: user.user_id,
            name: user.name,
        });
        await getRepository(Negotiation).save(negotiation);

        await getRepository(Rfq)
            .createQueryBuilder('rfq')
            .update(Rfq)
            .set({
                winner_supplier_id: supplierId,
                status: RfqStatus.awarded,
                updated_date: new Date(),
            })
            .where({ id: rfqId })
            .execute();
        eventSink.raiseEvent(Constant.RfqStatus.awarded, [rfqId, user]);
        return ResponseViewModel.withSuccess(true);
    }
    public async rejectRfq(
        rfqId: string,
        supplierId: string,
        reason: string,
        user?: RequestUserResponse,
    ): Promise<ResponseViewModel<SuccessResponse>> {
        const rfq = (await this.rfqService.getById(rfqId, user)).data;
        if (!rfq) {
            return ResponseViewModel.withError('rfq-id is incorrect');
        }
        const hasSupplierId = rfq.suppliers.some((e) => e.id === supplierId);

        if (!hasSupplierId) {
            return ResponseViewModel.withError('Supplier id is not part of this rfq');
        }
        if (!reason) {
            return ResponseViewModel.withError('Reason is mandatory');
        }

        await getRepository(Rfq)
            .createQueryBuilder('rfq')
            .update(Rfq)
            .set({ winner_supplier_id: null, status: RfqStatus.completed, updated_date: new Date() })
            .where({ id: rfqId })
            .execute();

        const negotiation = await getRepository(Negotiation).findOne({ rfq_id: rfqId });
        if (!negotiation.session.rfq_history) negotiation.session.rfq_history = [];
        negotiation.session.rfq_history.push({
            reason: reason,
            action: Constant.RfqAwardStatus.rejected,
            round: negotiation.round,
            at: new Date(),
            by: supplierId,
            name: user.name,
        });

        await getRepository(Negotiation).save(negotiation);
        eventSink.raiseEvent(Constant.RfqStatus.awardRejected, [rfqId, user]);
        return ResponseViewModel.withSuccess(true);
    }

    public async cloneRfq(rfqId: string, user?: RequestUserResponse): Promise<ResponseViewModel<SuccessResponse>> {
        try {
            // const negotiation = await getRepository(Negotiation).findOne({ rfq_id: rfqId });
            // if (!negotiation) {
            //     return ResponseViewModel.withError('Could not find RFQ');
            // }
            const rfq = await getRepository(Rfq).findOne({ id: rfqId });

            // const rfqResponse = await this.rfqService.getById(rfqId, user);
            // const { data: rfq } = rfqResponse;
            if (!rfq) {
                return ResponseViewModel.withError('Could not find RFQ');
            }
            // check RFQ should not be on an awarded or draft RFQ
            // this.rfqService.

            // await this.rfqService.create(rfqResponse.data, user);
            const getRfqItems = await this.rfqItemService.getRfqItems([rfqId]);
            const suppliers: RfqSupplierType[] = [];
            (await this.rfqSupplierService.getSuppliers([rfqId])).map((o) => {
                suppliers.push({
                    id: o.supplier_id,
                    suppliers: [{ id: o.supplier_id }],
                    send_mail: o.send_mail,
                });
            });

            const newRfq: RfqRequest = {
                items: getRfqItems,
                buyerId: (rfq.buyer_id as unknown) as string,
                supplierId: (rfq.supplier_id as unknown) as string,
                updated_by: user.user_id,
                organisation_id: user.organisation_id,
                created_by: user.user_id,
                status: 'draft',
                negotiation_process: { ...rfq.negotiation_process, deadlines: [], launch_date: new Date() },
                parameter: rfq.parameter,
                suppliers: suppliers,
            };

            const createdRfq = await this.rfqService.create(newRfq, {
                user_id: user.supplier_id,
                name: user.name,
                email: user.email,
                role: user.role,
                status: true,
                tenant_id: user.tenant_id,
                organisation_id: user.organisation_id,
                is_on_channel: false,
                supplier_id: null,
            });
            return ResponseViewModel.with({ success: true, data: createdRfq });
        } catch (error) {
            console.log(error, 'error');
        }
    }

    public async addComment(
        rfqId: string,
        payload: Record<string, unknown>,
        user?: RequestUserResponse,
    ): Promise<ResponseViewModel<SuccessResponse | CommentResponse>> {
        const negotiation = await getRepository(Negotiation).findOne({ rfq_id: rfqId });
        if (!negotiation) {
            return ResponseViewModel.withError('Could not find RFQ');
        }
        const { comment, round, supplier_id } = payload;
        if (user.role === Roles.supplier && !negotiation.valid_supplier_ids.includes(user.supplier_id)) {
            return ResponseViewModel.withError('Sorry!!! you are not a part of this rfq-negotiation anymore');
        }

        const offer = negotiation.session.offers.find(
            (offer) => offer.supplier_id === supplier_id && offer.round === round,
        );
        const negotiationComment = {
            by: user.name as string,
            user_id: user.user_id as string,
            comment: comment as string,
            at: new Date(),
        };
        if (!offer.comment) {
            offer.comment = [negotiationComment];
        } else {
            offer.comment.push(negotiationComment);
        }
        await getRepository(Negotiation).save(negotiation);

        return ResponseViewModel.withSuccess(true);
    }
}
