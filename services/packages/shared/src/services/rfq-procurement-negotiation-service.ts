import { injectable, inject } from 'inversify';
import { getRepository } from 'typeorm';
import {
    CategoryServiceContract,
    RfqNegotiationServiceContract,
    RfqServiceContract,
    SupplierServiceContract,
    UserServiceContract,
} from '.';
import { NegotiationSession, Offer } from '../types';
import { Constant, env, Util } from '../helpers';
import { MetaServiceContract } from './meta-service';
import { ProcurementParameters } from '../types/parameter';
import { RequestUserResponse, SuccessResponse } from '../viewmodels/response';
import { ResponseViewModel } from '../viewmodels/response-viewmodel';
import { Dashboard, Negotiation, Organisation, Rfq, RfqItem, RfqSupplier } from '../database/models';
import { RfqStatus, SessionStatus } from '../enum';
import { RfqResponseItem } from '../viewmodels/response/rfq-response';
import { eventSink } from '../factories';
const timeouts: { negoId: string; timeout: NodeJS.Timeout }[] = [];

const roundNearest = (value: number, min: number, max: number, multiplier: number): number => {
    const num = Math.round(value / multiplier) * multiplier;
    return Util.round(num > max ? max : num < min ? min : num, 2);
};
export interface RfqProcurementNegotiationServiceContract {
    calculateBotOffer(
        session: NegotiationSession,
        round: number,
        suppliers: string[],
        procurement_parameters: ProcurementParameters[],
        rfqId: string,
    ): Promise<Offer | void>;
    checkBotOffer(negotiation: Negotiation, rfqId: string): Promise<void>;
    checkRfqStatus(): Promise<ResponseViewModel<SuccessResponse>>;
    coPilotSubmitBid(
        rfqId: string,
        payload: Record<string, unknown>,
        user?: RequestUserResponse,
    ): Promise<ResponseViewModel<SuccessResponse>>;
    submitBid(
        rfqId: string,
        payload: Record<string, unknown>,
        user?: RequestUserResponse,
    ): Promise<ResponseViewModel<SuccessResponse>>;
    updateDashboardDetails(): Promise<ResponseViewModel<SuccessResponse>>;
    checkRfqAwardPending(): Promise<ResponseViewModel<SuccessResponse>>;
}

@injectable()
export class RfqProcurementNegotiationService implements RfqProcurementNegotiationServiceContract {
    public constructor(
        @inject('RfqNegotiationService') private readonly rfqRfqNegotiationService: RfqNegotiationServiceContract,
        @inject('MetaService') private readonly metaService: MetaServiceContract,
        @inject('RfqService') private readonly rfqService: RfqServiceContract,
        @inject('CategoryService') private readonly categoryService: CategoryServiceContract,
        @inject('UserService') private readonly userService: UserServiceContract,
        @inject('SupplierService') private readonly supplierService: SupplierServiceContract,
    ) {}

    async calculateBotOffer(
        session: NegotiationSession,
        round: number,
        suppliers: string[],
        procurement_parameters: ProcurementParameters[],
        rfqId: string,
        is_bot_active?: boolean,
    ): Promise<Offer | void> {
        // check if we are on round 0
        const matValueFromOrg = env.MINIMUM_ACCEPTANCE_THRESHOLD;
        const userType = 'supplier';
        if (round === 0) {
            return this.rfqRfqNegotiationService.calculateBaselineOffer(
                session,
                round,
                suppliers,
                procurement_parameters,
                false,
            );
        }
        const { offers, bot_parameter: botParameters, rfq_items } = session;

        if (!this.rfqRfqNegotiationService.shouldCalculate(offers, (suppliers || {}).length, round, userType)) {
            return;
        }

        if (
            await this.rfqRfqNegotiationService.updateRfqStatus(rfqId, round, session, userType, false, is_bot_active)
        ) {
            return;
        }
        const currrentRoundSupplierOffers = offers.filter((o) => o.by === userType && o.round === round); // 2 rows
        const prevRoundBotOffer = offers.find((o) => o.by === 'bot' && o.round === round - 1); // 1 row
        const roundConcessionPercent =
            botParameters.concession_pattern.length >= round - 1
                ? botParameters.concession_pattern[round - 1] / 100
                : botParameters.concession_pattern[round - 2] / 100;
        const minSupplierOffer = Math.min(...currrentRoundSupplierOffers.map((p) => p.total));

        const maxConcessionValue = Math.max(...currrentRoundSupplierOffers.map((o) => o.price_utility_score));
        const botPriceConcession = roundConcessionPercent * (1 - maxConcessionValue);
        const botOffer = this.rfqRfqNegotiationService.initiateBotOffer(
            round,
            botParameters.max_concession_round,
            false,
        );
        if (maxConcessionValue < matValueFromOrg) {
            const worstOffer = rfq_items.reduce((a, b) => +a + +b.baseline_quantity * b.baseline_price, 0);
            const matBotPriceConcession = roundConcessionPercent * (1 - matValueFromOrg);
            // const minOffer = worstOffer - (worstOffer - prevRoundBotOffer.total) * matValueFromOrg;
            const baseline = this.rfqRfqNegotiationService.getBaselineOffer(session.offers);
            const minOffer = worstOffer - (worstOffer - baseline.total) * matValueFromOrg;
            botOffer.total = prevRoundBotOffer.total + matBotPriceConcession * (minOffer - prevRoundBotOffer.total);
            botOffer.formula = `to calculate total >>> ${prevRoundBotOffer.total}+${matBotPriceConcession}*(${minOffer}- ${prevRoundBotOffer.total})`;
            botOffer.minFormula = `to calculate minOffer >>> ${worstOffer}-(${worstOffer}-${baseline.total})* ${matValueFromOrg})`;
        } else {
            botOffer.total =
                prevRoundBotOffer.total + botPriceConcession * (minSupplierOffer - prevRoundBotOffer.total);
            botOffer.formula = `${prevRoundBotOffer.total}+${botPriceConcession}*(${minSupplierOffer}- ${prevRoundBotOffer.total})`;
        }
        const { data } = this.metaService.botSchema();
        const optimalSupplierUtilityScores = this.rfqRfqNegotiationService.getOptimalParameterValues(
            currrentRoundSupplierOffers,
            'util_score',
        ); // payment_terms: 0.2, contract_terms: 0.1
        const optimalSupplierValues = this.rfqRfqNegotiationService.getOptimalParameterValues(
            currrentRoundSupplierOffers,
            'value',
            data,
        ); // payment_terms: 90, contract_terms: 12
        const { procurement_parameters: parametersSchema } = data;
        botOffer.rfq_offer = {
            rfq_parameters: (procurement_parameters || []).map((p) => {
                const maxUtilScore = roundConcessionPercent * (1 - optimalSupplierUtilityScores.get(p.name));
                const botPrevOffer = prevRoundBotOffer.rfq_offer.rfq_parameters.find((bp) => bp.name === p.name);
                // TODO: a. check if inverse - if yes, flip the formula
                const [min, max] = (p.value ? p.value : [0, 1]) as number[];
                const schema = parametersSchema.find((ps) => p.name === ps.name);
                //TODO: fix it for booleans

                const step = ((schema.parameters as any).value || { step: 1 }).step;
                if (maxConcessionValue < matValueFromOrg) {
                    const newmaxUtilScore = roundConcessionPercent * (1 - matValueFromOrg);
                    let currentOfferValue;
                    const procurement_parameter = session.bot_parameter.procurement_parameters.find(
                        (o) => o.name === p.name,
                    );
                    const procurement_parameters_list: number[] = Array.isArray(procurement_parameter.value)
                        ? procurement_parameter.value
                        : [];
                    let formula = '';
                    if (!schema.is_inverse) {
                        const worst_value_not_inverse = procurement_parameters_list[0];
                        const best_value_not_inverse = procurement_parameters_list[1];
                        const matValue =
                            worst_value_not_inverse +
                            (+best_value_not_inverse - worst_value_not_inverse) * env.MINIMUM_ACCEPTANCE_THRESHOLD; // need to check with inithas
                        currentOfferValue =
                            +botPrevOffer.rawValue -
                            newmaxUtilScore *
                                (+botPrevOffer.rawValue - Math.max(optimalSupplierValues.get(p.name), matValue));
                        formula = `Actual value: ${botPrevOffer.value} \n Max matValue ${matValue} ---- name: ${
                            p.name
                        }--- value${optimalSupplierValues.get(p.name)} \n Formula: ${
                            botPrevOffer.rawValue
                        }- ${newmaxUtilScore}* (${botPrevOffer.rawValue} - ${Math.max(
                            optimalSupplierValues.get(p.name),
                            matValue,
                        )})`;
                    } else {
                        const worst_value_inverse = procurement_parameters_list[1];
                        const best_offer_inverse = procurement_parameters_list[0];

                        const matValue_inverse =
                            worst_value_inverse -
                            (+worst_value_inverse - best_offer_inverse) * env.MINIMUM_ACCEPTANCE_THRESHOLD; // need to check with inithas
                        currentOfferValue =
                            +botPrevOffer.rawValue +
                            newmaxUtilScore *
                                (Math.min(optimalSupplierValues.get(p.name), matValue_inverse) - botPrevOffer.rawValue);
                        formula = `Actual value: ${botPrevOffer.value} \n Max matValue ${matValue_inverse} ---- name: ${
                            p.name
                        }--- value${optimalSupplierValues.get(p.name)} \n Formula: ${
                            botPrevOffer.rawValue
                        }+ ${newmaxUtilScore}* (${botPrevOffer.rawValue} - ${Math.min(
                            optimalSupplierValues.get(p.name),
                            matValue_inverse,
                        )})`;
                    }
                    return {
                        value: roundNearest(currentOfferValue, min, max, step),
                        rawValue: currentOfferValue,
                        formula: formula,
                        name: p.name,
                        label: schema.label,
                    };
                } else {
                    const currentOfferValue = !schema.is_inverse
                        ? +botPrevOffer.rawValue -
                          maxUtilScore * (optimalSupplierValues.get(p.name) - +botPrevOffer.rawValue)
                        : +botPrevOffer.rawValue -
                          maxUtilScore * (+botPrevOffer.rawValue - optimalSupplierValues.get(p.name));
                    const formula = !schema.is_inverse
                        ? `Actual value: ${botPrevOffer.value} \n  ---- name: ${
                              p.name
                          }--- value${optimalSupplierValues.get(p.name)}  \n Formula: ${botPrevOffer.rawValue} -
                          ${maxUtilScore} * (${optimalSupplierValues.get(p.name)} - ${botPrevOffer.rawValue})`
                        : `Actual value: ${botPrevOffer.value} \n ---- name: ${
                              p.name
                          }--- value${optimalSupplierValues.get(p.name)}  \n Formula: ${botPrevOffer.rawValue} -
                          ${maxUtilScore} * (${botPrevOffer.rawValue} - ${optimalSupplierValues.get(p.name)})`;

                    return {
                        value: roundNearest(currentOfferValue, min, max, step),
                        rawValue: currentOfferValue,
                        formula: formula,
                        name: p.name,
                        label: schema.label,
                    };
                }
            }),
            rfq_items: [],
        };

        this.rfqRfqNegotiationService.calculateUtilityScore(session, botOffer, false);

        return botOffer;
    }

    public async checkBotOffer(negotiation: Negotiation, rfqId: string): Promise<void> {
        const hasBotOfferForRound = negotiation.session.offers.some(
            (offer) => offer.by === 'bot' && offer.round === negotiation.round,
        );
        if (hasBotOfferForRound) {
            return;
        }
        const botOffer = await this.calculateBotOffer(
            negotiation.session,
            negotiation.round,
            negotiation.valid_supplier_ids,
            (negotiation.session.bot_parameter || { procurement_parameters: null }).procurement_parameters,
            rfqId,
            negotiation.is_bot_active,
        );

        if (botOffer) {
            negotiation.session.offers.push(botOffer);
            // calculate supplier offers && bot offer utility score for round = 0
            const totalOffers =
                negotiation.round === 0 && negotiation.session.offers.filter((offer) => offer.round === 0);
            (totalOffers || []).forEach((offer) => {
                this.rfqRfqNegotiationService.calculateUtilityScore(negotiation.session, offer);
            });

            // event handler if negotiation round, send notification for RFQRoundCompleted
            const isRoundComplete = this.rfqRfqNegotiationService.isRoundComplete(
                negotiation.round,
                negotiation.session.offers,
                negotiation.valid_supplier_ids.length,
            );
            negotiation.round = isRoundComplete && negotiation.round + 1;
            const rfq = (await this.rfqService.getById(rfqId)).data;
            const totalBotOffers = negotiation.session.offers.filter((offer) => offer.by === 'bot').length;
            if (isRoundComplete && totalBotOffers <= negotiation.session.bot_parameter.max_concession_round) {
                eventSink.raiseEvent(Constant.SupplierOfferEvents.onRfqNegotiationRoundCompleted, [
                    negotiation,
                    rfq,
                    botOffer,
                ]);
            }
        }
    }
    public async checkRfqStatus(): Promise<ResponseViewModel<SuccessResponse>> {
        // get all 'active' RFQs
        const rfqs = await getRepository(Rfq)
            .createQueryBuilder('rfq')
            .where('rfq.status = :status', { status: RfqStatus.active })
            .andWhere('rfq.buyer_id = 0')
            .getMany();
        const now = new Date();
        // For Each RFQ
        rfqs.forEach(async (rfq) => {
            if (rfq.negotiation_process !== null) {
                const negotiationForRfq = await getRepository(Negotiation).findOne({ rfq_id: rfq.id });
                if (negotiationForRfq && negotiationForRfq.is_bot_active) {
                    // get current round
                    const currentRound = negotiationForRfq.round;
                    // if has any offers or not
                    const hasOffers = negotiationForRfq.session.offers.length !== 0;
                    // get round deadline
                    const roundDate = new Date(rfq.negotiation_process.deadlines[currentRound]);

                    // if base-round deadline passed && no suppliers submit bid
                    if (roundDate < now && !hasOffers) {
                        await this.rfqService.updateRfqStatus(rfq.id, RfqStatus.completed);
                    }
                    if (roundDate < now && hasOffers) {
                        // get which suppliers have submitted bid for this current round before round date

                        const roundOfferFromSuppliers = negotiationForRfq.session.offers.filter(
                            (e) => e.by === 'supplier' && e.round === currentRound && new Date(e.at) <= roundDate,
                        );

                        negotiationForRfq.updated_date = now;
                        negotiationForRfq.valid_supplier_ids = roundOfferFromSuppliers.map((e) => e.supplier_id);
                        if (negotiationForRfq.valid_supplier_ids.length === 0) {
                            await this.rfqService.updateRfqStatus(rfq.id, RfqStatus.completed);
                        } else {
                            if (negotiationForRfq.round > 0) {
                                const neg = negotiationForRfq;
                                eventSink.raiseEvent(Constant.SupplierOfferEvents.onAllSuppliersRoundOfferSubmitted, [
                                    neg,
                                    'deadlinePassed',
                                    rfq.id,
                                ]);
                            }
                            this.checkBotOffer(negotiationForRfq, rfq.id);
                        }
                        await getRepository(Negotiation).save(negotiationForRfq);
                    }
                } else if (negotiationForRfq && !negotiationForRfq.is_bot_active) {
                    // console.log('checkRfqStatus - coming when bot in inactive');
                    // const currentRound = negotiationForRfq.round;
                    // const roundDate = new Date(rfq.negotiation_process.deadlines[currentRound]);
                    // const roundOfferFromSuppliers = negotiationForRfq.session.offers.filter(
                    //     (e) => e.by === 'supplier' && e.round === currentRound && new Date(e.at) <= roundDate,
                    // );
                    // negotiationForRfq.valid_supplier_ids = roundOfferFromSuppliers.map((e) => e.supplier_id); // don't calculate valid and invalid suppliers if co pilot intervened
                    // await getRepository(Negotiation).save(negotiationForRfq);
                }
            }
        });

        return ResponseViewModel.withSuccess(true);
    }
    public async submitBid(
        rfqId: string,
        payload: Record<string, unknown>,
        user?: RequestUserResponse,
    ): Promise<ResponseViewModel<SuccessResponse>> {
        try {
            const negotiation = await getRepository(Negotiation).findOne({ rfq_id: rfqId });
            if (!negotiation) {
                return ResponseViewModel.withError('Could not find RFQ');
            }
            const rfqResponse = await this.rfqService.getById(rfqId, user);
            const { data: rfq } = rfqResponse;
            if (!rfq) {
                return ResponseViewModel.withError('Could not find RFQ');
            }
            // check RFQ should not be on an awarded or draft RFQ
            const checkStatus = rfq.status === RfqStatus.draft || rfq.status === RfqStatus.awarded;
            if (checkStatus) {
                return ResponseViewModel.withError('Cannot submit bid for draft or awarded RFQ');
            }
            // if this is the last supplier's offer and we are on round 0, calculate baseline
            const suppliers = negotiation.valid_supplier_ids || [];
            const isValidSupplier = negotiation.valid_supplier_ids.some((id) => id === user.supplier_id);
            if (!isValidSupplier) {
                return ResponseViewModel.withError('Cannot submit bid for this RFQ');
            }

            const currentRound = this.rfqRfqNegotiationService.getCurrentRound(negotiation.session.offers);
            const isRoundComplete = this.rfqRfqNegotiationService.isRoundComplete(
                currentRound,
                negotiation.session.offers,
                suppliers.length,
            );
            const newRound = isRoundComplete ? currentRound + 1 : currentRound;
            const roundDate = new Date(rfq.negotiation_process.deadlines[newRound]);
            const canBid = this.rfqRfqNegotiationService.canSupplierBid(
                newRound,
                negotiation.session.offers,
                user.supplier_id,
                roundDate,
                negotiation.is_bot_active,
            );
            if (!canBid) {
                return ResponseViewModel.withError('The RFQ is not accepting offers at this moment');
            }
            const total = (payload.rfq_items as RfqResponseItem[]).reduce(
                (p: number, c) => p + +c.baseline_price * +c.baseline_quantity,
                0,
            );
            const offer = new Offer();
            offer.by = 'supplier';
            // all suppliers have made bids?
            const supplierId = user.supplier_id;
            offer.user_Id = user.user_id;
            offer.supplier_id = supplierId;
            offer.total = total;
            offer.round = newRound;
            offer.at = new Date();
            if (payload.comment) {
                const negotiationComment = [
                    {
                        by: user.name as string,
                        user_id: user.user_id as string,
                        comment: payload.comment as string,
                        at: offer.at as Date,
                    },
                ];
                offer.comment = negotiationComment;
            }
            delete payload.comment;
            offer.rfq_offer = payload as any;
            if (offer.round > 0) {
                this.rfqRfqNegotiationService.calculateUtilityScore(negotiation.session, offer);
            }

            negotiation.session.offers.push(offer);
            negotiation.round = offer.round;
            await getRepository(Negotiation).save(negotiation);
            const neg = await getRepository(Negotiation).findOne({ rfq_id: rfqId });
            if (
                neg.round > 0 &&
                this.rfqRfqNegotiationService.shouldCalculate(neg.session.offers, suppliers.length, neg.round)
            ) {
                eventSink.raiseEvent(Constant.SupplierOfferEvents.onAllSuppliersRoundOfferSubmitted, [
                    neg,
                    'allSupplierSubmitBid',
                    rfqId,
                ]);
            }
            if (negotiation.is_bot_active && env.BOT_COUNTER_OFFER_DELAY > -1) {
                const isLastSupplier =
                    neg &&
                    this.rfqRfqNegotiationService.shouldCalculate(neg.session.offers, suppliers.length, neg.round);
                if (isLastSupplier) {
                    const timeout = setTimeout(async () => {
                        if (neg.is_bot_active) {
                            this.checkBotOffer(neg, rfqId);
                            await getRepository(Negotiation).save(neg);
                        }
                    }, env.BOT_COUNTER_OFFER_DELAY * 1000);
                    timeouts.push({ negoId: negotiation.id, timeout: timeout });
                }
            }
            await getRepository(Negotiation).save(negotiation);
            eventSink.raiseEvent(Constant.SupplierOfferEvents.onSupplierOfferSubmitted, [offer, rfqId]);

            return ResponseViewModel.withSuccess(true);
        } catch (error) {
            console.log(error, 'error********');
        }
    }
    public async coPilotSubmitBid(
        rfqId: string,
        payload: Record<string, unknown>,
        user?: RequestUserResponse,
    ): Promise<ResponseViewModel<SuccessResponse>> {
        try {
            const negotiation = await getRepository(Negotiation).findOne({ rfq_id: rfqId });
            if (!negotiation) {
                return ResponseViewModel.withError('Could not find RFQ');
            }
            const rfqResponse = await this.rfqService.getById(rfqId, user);
            const { data: rfq } = rfqResponse;
            if (!rfq) {
                return ResponseViewModel.withError('Could not find RFQ');
            }
            // check RFQ should not be on an awarded or draft RFQ
            const checkStatus = rfq.status === RfqStatus.draft || rfq.status === RfqStatus.awarded;
            const completedStatus = rfq.status === RfqStatus.completed;
            if (checkStatus) {
                return ResponseViewModel.withError('Cannot submit bid for draft or awarded RFQ');
            }
            if (completedStatus && !payload.reOpen) {
                return ResponseViewModel.with({ success: true, confirm: true });
            }
            const currentRound = this.rfqRfqNegotiationService.getCurrentRound(negotiation.session.offers);
            const total = (payload.rfq_items as RfqResponseItem[]).reduce(
                (p: number, c) => p + +c.baseline_price * +c.baseline_quantity,
                0,
            );
            // if (currentRound === 0) {
            //     return ResponseViewModel.withError('You cant submit this offer on round 0');
            // }
            // const hasBotOffer = negotiation.session.offers.find((o) => o.by === 'bot' && o.round === currentRound);
            // if (hasBotOffer) {
            //     return ResponseViewModel.withError(
            //         `Cannot submit bid  because Bot has already submitted for round ${currentRound}`,
            //     );
            // }
            const offer = new Offer();
            const negotiation_process = rfqResponse.data.negotiation_process;
            const baseline = this.rfqRfqNegotiationService.getBaselineOffer(negotiation.session.offers);
            const calculatedCurrentRound =
                currentRound === 0 || baseline.by === 'copilot' ? currentRound : currentRound + 1;
            negotiation_process.deadlines.splice(calculatedCurrentRound, 1, payload.deadlineDate.toString());

            offer.by = 'copilot';
            offer.user_Id = user.user_id;
            offer.total = total;
            offer.round = calculatedCurrentRound;
            offer.at = new Date();
            offer.message = payload.comment as string;
            delete payload.comment;
            offer.rfq_offer = payload as any;
            negotiation.session.offers.push(offer);
            negotiation.round = offer.round;
            negotiation.is_bot_active = false;
            const currentTimeouts = timeouts.filter((t) => t.negoId === negotiation.id);
            currentTimeouts.map((time) => {
                clearTimeout(time.timeout);
            });
            for (let index = 0; index < currentTimeouts.length; index++) {
                const i = timeouts.findIndex((t) => t.negoId === negotiation.id);
                timeouts.splice(i, 1);
            }
            negotiation.status = SessionStatus.in_progress;
            if (payload.validSupplierIds) negotiation.valid_supplier_ids = payload.validSupplierIds as string[];
            if (currentRound === 0) {
                const totalOffers = negotiation.session.offers.filter((offer) => offer.round === 0);
                (totalOffers || []).forEach((offer) => {
                    this.rfqRfqNegotiationService.calculateUtilityScore(negotiation.session, offer);
                });
            } else {
                this.rfqRfqNegotiationService.calculateUtilityScore(negotiation.session, offer);
            }

            await getRepository(Negotiation).save(negotiation);
            await getRepository(Rfq).update(
                { id: rfqResponse.data.id },
                { negotiation_process: negotiation_process, status: RfqStatus.active },
            );
            eventSink.raiseEvent(Constant.CopilotOfferEvents.onCopilotOfferSubmitted, [offer, user, rfqId]);
            return ResponseViewModel.withSuccess(true);
        } catch (error) {
            console.log(error, 'error');
        }
    }
    public async updateDashboardDetails(): Promise<ResponseViewModel<SuccessResponse>> {
        // get all RFQs
        const rfqs = await getRepository(Rfq)
            .createQueryBuilder('rfq')
            .where('rfq.status != :status', { status: RfqStatus.draft })
            .andWhere('rfq.buyer_id = 0 or rfq.buyer_id is NULL')
            .getMany();
        const rfqIds = rfqs.map((r) => r.id);
        const rfqSuppliers = await getRepository(RfqSupplier)
            .createQueryBuilder('rfq_supplier')
            .where('rfq_supplier.rfq_id in (:...ids)', { ids: rfqIds.length ? rfqIds : [''] })
            .getMany();
        const rfqSupplierIds = [...new Set(rfqSuppliers.map((r) => r.supplier_id))];
        const rfqSupplierUsers = await this.userService.getBySupplierIds(rfqSupplierIds);
        const rfqSupplierUserInfo = await this.userService.getBySupplierIds(rfqSupplierIds);
        const rfqItems = await getRepository(RfqItem)
            .createQueryBuilder('rfq_item')
            .where('rfq_item.rfq_id in (:...ids)', { ids: rfqIds.length ? rfqIds : [''] })
            .getMany();
        const negotiations = await getRepository(Negotiation)
            .createQueryBuilder('negotiation')
            .where('negotiation.rfq_id in (:...ids)', { ids: rfqIds.length ? rfqIds : [''] })
            .getMany();

        // generate dashboard details
        const dashboardDetails = await Promise.all(
            negotiations.map(async (n) => {
                const rfq = rfqs.find((r) => r.id === n.rfq_id);
                const rfqSupplier = rfqSuppliers.filter((r) => r.rfq_id === n.rfq_id);
                const rfqSupplierIds = rfqSupplier.map((r) => r.supplier_id);
                const rfqSupplierUser = rfqSupplierUsers.filter((r) => rfqSupplierIds.includes(r.supplier_id));
                const rfqSupplierUserIds = rfqSupplierUser.map((r) => r.user_id);
                const rfqItem = rfqItems.find((r) => r.rfq_id === n.rfq_id);
                const supplierInfo = await this.supplierService.getLightweightBySupplierIds(rfqSupplierIds);
                const supplierUserInfo = rfqSupplierUserInfo.filter((e) => rfqSupplierIds.includes(e.supplier_id));
                const organisation = await getRepository(Organisation).findOne({
                    organisation_id: rfq.organisation_id,
                });
                const session = n.session;
                const totalHistoricPrice = !session
                    ? rfqItem.baseline_price * rfqItem.baseline_quantity
                    : session.rfq_items.reduce((acc, val) => acc + val.baseline_price * val.baseline_quantity, 0);
                const revisedBaselinePrice =
                    rfq &&
                    rfq.parameter &&
                    totalHistoricPrice - (totalHistoricPrice * rfq.parameter.rfq_target_saving) / 100;
                const offersByWinnerSupplier =
                    rfq.status === RfqStatus.awarded &&
                    n.session.offers.filter((a) => a.by === 'supplier' && a.supplier_id === rfq.winner_supplier_id);
                const lastOfferByWinnerSupplier = offersByWinnerSupplier[offersByWinnerSupplier.length - 1];
                const categoryDetails = (await this.categoryService.getById(rfq.category_ids[0])).data;
                return {
                    id: '',
                    organisation_id: rfq.organisation_id,
                    organisation_name: organisation.name,
                    rfq_id: rfq.id,
                    rfq_created_date: rfq.created_date,
                    rfq_status: rfq.status,
                    rfq_supplier_ids: rfqSupplierIds,
                    rfq_supplier_user_ids: rfqSupplierUserIds,
                    rfq_supplier_names: supplierUserInfo.map((e) => e.name),
                    rfq_awarded_date: rfq.status === RfqStatus.awarded ? rfq.updated_date : null,
                    purchase_type: rfq.negotiation_process ? rfq.negotiation_process.purchase_type : null,
                    total_historic_price: totalHistoricPrice,
                    revised_baseline_price: revisedBaselinePrice,
                    rfq_awarded_price: rfq.status === RfqStatus.awarded ? lastOfferByWinnerSupplier.total : null,
                    total_savings:
                        rfq.status === RfqStatus.awarded ? totalHistoricPrice - lastOfferByWinnerSupplier.total : null,
                    winner_supplier_id: rfq.status === RfqStatus.awarded ? rfq.winner_supplier_id : null,
                    winner_supplier_name:
                        rfq.status === RfqStatus.awarded
                            ? supplierUserInfo.find((s) => s.supplier_id === rfq.winner_supplier_id).name
                            : null,
                    winner_supplier_company_name:
                        rfq.status === RfqStatus.awarded
                            ? supplierInfo.find((s) => s.id === rfq.winner_supplier_id).name
                            : null,
                    product_ids: session.rfq_items.map((e) => e.product_id),
                    product_names: session.rfq_items.map((e) => e.name),
                    category: {
                        id: categoryDetails.id,
                        name: categoryDetails.name,
                    },
                };
            }),
        );
        const existedDashboardData = await getRepository(Dashboard)
            .createQueryBuilder('dashboard')
            .select(['dashboard.id', 'dashboard.rfq_id'])
            .getMany();
        // updating dashboard
        await Promise.all(
            dashboardDetails.map(async (data) => {
                const hasAlreadyRfq = existedDashboardData.some((e) => e.rfq_id === data.rfq_id);
                const id = hasAlreadyRfq ? existedDashboardData.find((e) => e.rfq_id === data.rfq_id).id : Util.guid();
                data.id = id;
                await getRepository(Dashboard).save(data);
            }),
        );
        return ResponseViewModel.withSuccess();
    }
    public async checkRfqAwardPending(): Promise<ResponseViewModel<SuccessResponse>> {
        // get all 'awardrequested' RFQs
        const rfqs = await getRepository(Rfq)
            .createQueryBuilder('rfq')
            .where('rfq.status = :status', { status: RfqStatus.awardrequested })
            .andWhere('rfq.updated_date  <= :date', { date: new Date(new Date().setDate(new Date().getDate() - 2)) })
            .getMany();
        rfqs.forEach(async (rfq) => {
            await getRepository(Rfq)
                .createQueryBuilder('rfq')
                .update(Rfq)
                .set({ winner_supplier_id: null, status: RfqStatus.completed, updated_date: new Date() })
                .where({ id: rfq.id })
                .execute();
        });

        return ResponseViewModel.withSuccess(true);
    }
}
