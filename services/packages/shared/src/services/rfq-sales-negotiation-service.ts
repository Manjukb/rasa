import { RequestUserResponse } from '../viewmodels/response';
import { injectable, inject } from 'inversify';
import { ResponseViewModel } from '../viewmodels/response-viewmodel';
import { RfqServiceContract, RfqNegotiationServiceContract } from '.';
import { getRepository } from 'typeorm';
import { Negotiation, Rfq } from '../database/models';
import { NegotiationSession, Offer } from '../types';
import { Constant, env, Util } from '../helpers';
import { RfqResponseItem } from '../viewmodels/response/rfq-response';
import { SessionStatus } from '../enum';
import { ProcurementParameters, NegotiationResponse } from '../types/parameter';
import { MetaServiceContract } from './meta-service';
import { RfqStatus } from '../enum/rfq-status';
const roundNearest = (value: number, min: number, max: number, multiplier: number): number => {
    const num = Math.round(value / multiplier) * multiplier;
    return Util.round(num > max ? max : num < min ? min : num, 2);
};
export interface RfqSalesNegotiationServiceContract {
    negotiateSalesBot(
        rfqId: string,
        payload: Record<string, unknown>,
        exitNegotiation: boolean,
        accept: boolean,
        user?: RequestUserResponse,
    ): Promise<ResponseViewModel<NegotiationResponse>>;
    calculateBotOffer(
        session: NegotiationSession,
        round: number,
        suppliers: string[],
        procurement_parameters: ProcurementParameters[],
        rfqId: string,
    ): Promise<Offer | void>;
}

@injectable()
export class RfqSalesNegotiationService implements RfqSalesNegotiationServiceContract {
    public constructor(
        @inject('RfqService') private readonly rfqService: RfqServiceContract,
        @inject('RfqNegotiationService') private readonly rfqNegotiationService: RfqNegotiationServiceContract,
        @inject('MetaService') private readonly metaService: MetaServiceContract,
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
        const matValueFromOrg = session.bot_parameter?.max_concession_score || env.MINIMUM_ACCEPTANCE_THRESHOLD;
        const userType = 'buyer';
        if (round === 0) {
            return this.rfqNegotiationService.calculateBaselineOffer(
                session,
                round,
                suppliers,
                procurement_parameters,
                true,
            );
        }
        const { offers, bot_parameter: botParameters } = session;

        if (await this.rfqNegotiationService.updateRfqStatus(rfqId, round, session, userType, true, is_bot_active)) {
            return;
        }
        const currrentRoundSupplierOffers = offers.filter((o) => o.by === userType);

        const prevRoundBotOffer = offers.find((o) => o.by === 'bot' && o.round === round - 1); // 1 row
        const roundConcessionPercent =
            botParameters.concession_pattern.length >= round - 1
                ? botParameters.concession_pattern[round - 1] / 100
                : botParameters.concession_pattern[round - 2] / 100;

        const botOffer = this.rfqNegotiationService.initiateBotOffer(round, botParameters.max_concession_round, true);
        const baseline = this.rfqNegotiationService.getBaselineOffer(session.offers);
        botOffer.rfq_offer = {
            rfq_parameters: [],
            rfq_items: Util.deepClone(baseline.rfq_offer.rfq_items),
        };
        prevRoundBotOffer.rfq_offer.rfq_items.map((item, i) => {
            const supplier_product_offer =
                currrentRoundSupplierOffers[currrentRoundSupplierOffers.length - 1].rfq_offer.rfq_items[i];
            const baseline_product_offer = baseline.rfq_offer.rfq_items[i];
            const initial_offer_price = session.rfq_items[i];

            const latestBuyerPriceOffer = supplier_product_offer.baseline_price;
            const latestBuyerQuantityOffer = supplier_product_offer.baseline_quantity;
            const baseline_price = Number(baseline_product_offer.baseline_price); // 1st bot offer for price it will be catalog_price
            const initial_price = Number(initial_offer_price.baseline_price); // min price / initial price

            const initial_quantity = Number(initial_offer_price.baseline_quantity); // min qty
            const baseline_quantity = Number(baseline_product_offer.baseline_quantity); // 1st bot offer for qty it will be catalog_price

            const price_max_concession_threshold_value_of_item =
                Number(initial_price) + (Number(baseline_price) - Number(initial_price)) * Number(matValueFromOrg);

            const quantity_max_concession_threshold_value_of_item =
                Number(initial_quantity) + (Number(baseline_quantity) - Number(initial_quantity)) * matValueFromOrg;
            const final_price =
                item.baseline_price -
                (item.baseline_price - Math.max(latestBuyerPriceOffer, price_max_concession_threshold_value_of_item)) *
                    roundConcessionPercent;
            const final_quantity =
                item.baseline_quantity -
                (item.baseline_quantity -
                    Math.max(latestBuyerQuantityOffer, quantity_max_concession_threshold_value_of_item)) *
                    roundConcessionPercent;

            botOffer.rfq_offer.rfq_items[i].baseline_price = roundNearest(
                final_price,
                initial_price,
                baseline_price,
                (botParameters.step_count || {}).price || Constant.StepCount.price,
            );
            botOffer.rfq_offer.rfq_items[i].baseline_quantity = roundNearest(
                final_quantity,
                initial_quantity,
                baseline_quantity,
                (botParameters.step_count || {}).quantity || Constant.StepCount.quantity,
            );
            const final_total_value = Util.round(
                botOffer.rfq_offer.rfq_items[i].baseline_quantity * botOffer.rfq_offer.rfq_items[i].baseline_price,
                2,
            );
            botOffer.total += final_total_value;
        });
        const { data } = this.metaService.salesBotSchema();
        const optimalSupplierValues = this.rfqNegotiationService.getOptimalParameterValues(
            currrentRoundSupplierOffers,
            'value',
            data,
        ); // payment_terms: 90, contract_terms: 12
        const { procurement_parameters: parametersSchema } = data;
        botOffer.rfq_offer = {
            rfq_parameters: (procurement_parameters || []).map((p) => {
                const botPrevOffer = prevRoundBotOffer.rfq_offer.rfq_parameters.find((bp) => bp.name === p.name);
                // TODO: a. check if inverse - if yes, flip the formula
                const [min, max] = (p.value ? p.value : [0, 1]) as number[];
                const schema = parametersSchema.find((ps) => p.name === ps.name);
                //TODO: fix it for booleans

                const step = ((schema.parameters as any).value || { step: 1 }).step;
                const max_concession_threshold_value_of_parma = max - (max - min) * matValueFromOrg;
                const currentOfferValue =
                    +botPrevOffer.rawValue +
                    (Math.min(max_concession_threshold_value_of_parma, optimalSupplierValues.get(p.name)) -
                        +botPrevOffer.rawValue) *
                        roundConcessionPercent;
                return {
                    value: roundNearest(currentOfferValue, min, max, step),
                    // value: currentOfferValue,
                    rawValue: currentOfferValue,
                    name: p.name,
                    label: schema.label,
                };
            }),
            rfq_items: botOffer.rfq_offer.rfq_items,
        };

        this.rfqNegotiationService.calculateUtilityScore(session, botOffer, true);

        return botOffer;
    }

    public async negotiateSalesBot(
        rfqId: string,
        payload: Record<string, unknown>,
        exitNegotiation: boolean,
        accept: boolean,
        user?: RequestUserResponse,
    ): Promise<ResponseViewModel<NegotiationResponse>> {
        const negotiation = await getRepository(Negotiation).findOne({ rfq_id: rfqId });
        if (exitNegotiation) {
            await this.rfqService.updateRfqStatus(rfqId, RfqStatus.completed);
            negotiation.status = SessionStatus.customer_rejected;
            const newNegotiation = await getRepository(Negotiation).save(negotiation);
            const rfqData = await getRepository(Rfq).findOne({ id: rfqId });
            return ResponseViewModel.with(await this.rfqNegotiationService.transformData(newNegotiation, rfqData));
        }
        if (accept) {
            await this.rfqService.updateRfqStatus(rfqId, RfqStatus.completed);
            negotiation.status = SessionStatus.customer_accepted;
            const newNegotiation = await getRepository(Negotiation).save(negotiation);
            const rfqData = await getRepository(Rfq).findOne({ id: rfqId });
            return ResponseViewModel.with(await this.rfqNegotiationService.transformData(newNegotiation, rfqData));
        }
        if (!negotiation) {
            return ResponseViewModel.withError('Could not find RFQ');
        }
        const rfqResponse = await this.rfqService.getById(rfqId, user);
        const { data: rfq } = rfqResponse;
        if (!rfq) {
            return ResponseViewModel.withError('Could not find RFQ');
        }
        // check RFQ should not be on an awarded or draft RFQ
        const checkStatus = rfq.status === RfqStatus.completed || rfq.status === RfqStatus.awarded;
        if (checkStatus) {
            return ResponseViewModel.withError('Cannot submit bid for completed or awarded RFQ');
        }

        const suppliers = negotiation.valid_supplier_ids || [];
        const currentRound = this.rfqNegotiationService.getCurrentRound(negotiation.session.offers);
        const isRoundComplete = this.rfqNegotiationService.isRoundCompleteSales(
            currentRound,
            negotiation.session.offers,
            suppliers.length,
        );
        const newRound = isRoundComplete ? currentRound + 1 : currentRound;
        const total = Util.round(
            (payload.rfq_items as RfqResponseItem[]).reduce(
                (p: number, c) => p + +c.baseline_price * +c.baseline_quantity,
                0,
            ),
            2,
        );

        const offer = new Offer();

        offer.by = 'buyer';
        offer.total = total;
        offer.round = newRound === 0 ? 1 : newRound;
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
        this.rfqNegotiationService.calculateUtilityScore(negotiation.session, offer, true);

        negotiation.session.offers.push(offer);
        negotiation.round = offer.round;
        negotiation.status = SessionStatus.in_progress;

        const newNegotiation = await getRepository(Negotiation).save(negotiation);

        let botOffer = null;

        if (newNegotiation.is_bot_active && negotiation.session.bot_parameter?.bot_counter_offer_delay > 1) {
            setTimeout(async () => {
                botOffer = await this.calculateBotOffer(
                    newNegotiation.session,
                    newNegotiation.round,
                    newNegotiation.valid_supplier_ids,
                    (newNegotiation.session.bot_parameter || { procurement_parameters: null }).procurement_parameters,
                    rfqId,
                    true,
                );
                if (botOffer) {
                    newNegotiation.session.offers.push(botOffer);
                    if (newNegotiation.round >= newNegotiation.session.bot_parameter.max_concession_round) {
                        await this.rfqService.updateRfqStatus(rfqId, RfqStatus.completed);
                    }
                }
                await getRepository(Negotiation).save(newNegotiation);
            }, negotiation.session.bot_parameter?.bot_counter_offer_delay * 1000);
        } else if (newNegotiation.is_bot_active) {
            botOffer = await this.calculateBotOffer(
                newNegotiation.session,
                newNegotiation.round,
                newNegotiation.valid_supplier_ids,
                (newNegotiation.session.bot_parameter || { procurement_parameters: null }).procurement_parameters,
                rfqId,
                true,
            );
        }
        if (botOffer) {
            newNegotiation.session.offers.push(botOffer);
        }
        if (
            newNegotiation.is_bot_active &&
            newNegotiation.round >= newNegotiation.session.bot_parameter.max_concession_round
        ) {
            await this.rfqService.updateRfqStatus(rfqId, RfqStatus.completed);
        }
        const savedNegotiationData = await getRepository(Negotiation).save(newNegotiation);
        const rfqData = await getRepository(Rfq).findOne({ id: rfqId });
        return ResponseViewModel.with(await this.rfqNegotiationService.transformData(savedNegotiationData, rfqData));
    }
}
