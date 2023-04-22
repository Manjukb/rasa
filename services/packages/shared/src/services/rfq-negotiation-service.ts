import {
    BotSchemaResponse,
    CommentResponse,
    NegotiationSessionResponse,
    RequestUserResponse,
    SuccessResponse,
} from '../viewmodels/response';
import { injectable, inject } from 'inversify';
import { ResponseViewModel } from '../viewmodels/response-viewmodel';
import { MailServiceContract, OrganisationServiceContract, RfqServiceContract, SupplierServiceContract } from './';
import { getRepository } from 'typeorm';
import { Negotiation, Organisation, Rfq, Customer, Product, ProductParameter } from '../database/models';
import { NegotiationSession, Offer } from '../types';
import { Constant, env, Util, BotResultMessage } from '../helpers';
import { RfqResponse } from '../viewmodels/response/rfq-response';
import { RfqSupplierServiceContract } from './rfq-supplier-service';
import { SessionStatus, Roles } from '../enum';
import { ProcurementParameters } from '../types/parameter';
import { MetaServiceContract } from './meta-service';
import { RfqStatus } from '../enum/rfq-status';
import { eventSink } from '..';
import { ProcurementParameterFieldWithBoolean } from '../viewmodels/response/bot-schema-response';

const roundNearest = (value: number, min: number, max: number, multiplier: number): number => {
    const num = Math.round(value / multiplier) * multiplier;
    return Util.round(num > max ? max : num < min ? min : num, 2);
};
export interface RfqNegotiationServiceContract {
    getById(id: string, user?: RequestUserResponse): Promise<ResponseViewModel<Record<string, unknown>>>;
    calculateBaselineOffer(
        session: NegotiationSession,
        round: number,
        suppliers: string[],
        procurement_parameters: ProcurementParameters[],
        isSalesBot: boolean,
    ): Offer | void;
    getOptimalParameterValues(offers: Offer[], key: string, botSchema?: BotSchemaResponse): Map<string, number>;
    shouldCalculate(offers: Offer[], totalSuppliers: number, round: number, userType?: string): boolean;
    updateRfqStatus(
        rfqId: string,
        round: number,
        session: NegotiationSession,
        userType: string,
        isSalesBot?: boolean,
        is_bot_active?: boolean,
    ): Promise<boolean>;
    initiateBotOffer(round: number, max_concession_round: number, isSalesBot: boolean): Offer;
    transformData(
        negotiation: Negotiation,
        rfq: Rfq,
    ): Promise<{
        channel_id: string;
        rfq: Rfq;
        rfq_number: string;
        rfq_id: string;
        customer: Customer;
        products: Product[];
        updated_date: Date;
        session: NegotiationSession;
        status: string;
        nego: Negotiation;
    }>;
    canSupplierBid(
        round: number,
        offers: Offer[],
        supplierId: string,
        roundDeadline: Date,
        is_bot_active: boolean,
    ): boolean;
    calculateUtilityScore(session: NegotiationSession, offer: Offer, isSalesBot?: boolean): void;
    getCurrentRound(offers: Offer[]): number;
    getBaselineOffer(offers: Offer[]): Offer;
    isRoundCompleteSales(round: number, offers: Offer[], totalSuppliers: number): boolean;
    isRoundComplete(round: number, offers: Offer[], totalSuppliers: number): boolean;
}

@injectable()
export class RfqNegotiationService implements RfqNegotiationServiceContract {
    public constructor(
        @inject('RfqService') private readonly rfqService: RfqServiceContract,
        @inject('RfqSupplierService') private readonly rfqSupplierService: RfqSupplierServiceContract,
        @inject('MetaService') private readonly metaService: MetaServiceContract,
        @inject('SupplierService') private readonly supplierService: SupplierServiceContract,
        @inject('MailService') private readonly mailService: MailServiceContract,
        @inject('OrganisationService') private readonly orgService: OrganisationServiceContract,
    ) {}

    public async updateRfqStatus(
        rfqId: string,
        round: number,
        session: NegotiationSession,
        userType: string,
        isSalesBot?: boolean,
        is_bot_active?: boolean,
    ): Promise<boolean> {
        const { offers } = session;
        //auto-close an RFQ if one of the offer is above auto accept score or max rounds are over
        const hasAutoAcceptOffer = offers.some(
            (o) => o.by === userType && o.round === round && o.utility_score >= env.PROCUREMENT_AUTO_ACCEPT_SCORE,
        );

        const botTotal = (offers.find((o) => o.by === 'bot' && o.round === round - 1) || {}).total;
        const satisfiedBotOffer = isSalesBot
            ? offers.filter((o) => o.by === userType && o.round === round).find((of) => of.total >= botTotal)
            : offers.filter((o) => o.by === userType && o.round === round).find((of) => of.total <= botTotal);

        if (hasAutoAcceptOffer) {
            await this.rfqService.updateRfqStatus(rfqId, RfqStatus.completed);
            if (!isSalesBot) eventSink.raiseEvent(Constant.SupplierOfferEvents.onAutoAcceptScoreReached, rfqId);
            return true;
        }

        if (round >= session.bot_parameter.max_concession_round && !isSalesBot && is_bot_active) {
            await this.rfqService.updateRfqStatus(rfqId, RfqStatus.completed);
            if (!isSalesBot)
                eventSink.raiseEvent(Constant.SupplierOfferEvents.onRfqFinalRoundCompleted, [rfqId, round]);
            return true;
        }
        if (satisfiedBotOffer) {
            await this.rfqService.updateRfqStatus(rfqId, RfqStatus.completed);
            return true;
        }
        return false;
    }

    public shouldCalculate(offers: Offer[], totalSuppliers: number, round: number, userType?: string): boolean {
        const by = userType ? userType : 'supplier';
        const totalOffers = (offers.filter((o) => o.by === by && o.round === round) || []).length;
        return totalOffers === totalSuppliers;
    }

    public isRoundComplete(round: number, offers: Offer[], totalSuppliers: number): boolean {
        return (
            this.shouldCalculate(offers, totalSuppliers, round) &&
            offers.length &&
            (offers[offers.length - 1].by === 'bot' || offers[offers.length - 1].by === 'copilot')
        );
    }

    public isRoundCompleteSales(round: number, offers: Offer[], totalSuppliers: number): boolean {
        return (
            this.shouldCalculate(offers, totalSuppliers, round, 'buyer') &&
            offers.length &&
            offers[offers.length - 1].by === 'bot'
        );
    }

    public getCurrentRound(offers: Offer[]): number {
        // find the last offer by the bot
        const lastBotOffer = offers.length > 0 ? offers[offers.length - 1] : null;
        return lastBotOffer ? lastBotOffer.round : 0;
    }

    private getBotMessage(round: number, max_concession_round: number, isSales: boolean): string {
        // find the bot message for round
        const botMessages = isSales ? this.metaService.salesBotMessages() : this.metaService.procurementBotMessages();
        if (round === 0 && isSales) return '';
        const firstRandom = Math.round(Math.random() * 2);
        const firstProcurementRandom = Math.round(Math.random() * 1);
        const midRandom = Math.round(Math.random() * 8);
        if (round === 0 && !isSales) return botMessages.data.first[firstProcurementRandom];
        if (round === 1 && isSales) return botMessages.data.first[firstRandom];
        else if (round === max_concession_round) return botMessages.data.last[firstRandom];
        else return botMessages.data.mid[midRandom];
    }

    public initiateBotOffer(round: number, max_concession_round: number, isSalesBot: boolean): Offer {
        const offer = new Offer();
        offer.by = 'bot';
        offer.at = new Date();
        offer.round = round;
        offer.total = 0;
        offer.message = this.getBotMessage(round, max_concession_round, isSalesBot);

        return offer;
    }

    public getOptimalParameterValues(offers: Offer[], key: string, botSchema?: BotSchemaResponse): Map<string, number> {
        const paramConcessionPatterns = [].concat(
            ...offers.map((p) => (p.rfq_offer.rfq_parameters ? p.rfq_offer.rfq_parameters : false)),
        );
        return paramConcessionPatterns.reduce((a, c) => {
            if (!a.has(c.name)) {
                a.set(c.name, c[key]);
                return a;
            }
            let isInverse = false;
            if (botSchema) {
                isInverse = (botSchema.procurement_parameters.find((p) => p.name === c.name) || {}).is_inverse;
            }
            a.set(c.name, isInverse ? Math.min((a.get(c.name), c[key])) : Math.max(a.get(c.name), c[key]));
            return a;
        }, new Map());
    }

    public calculateBaselineOffer(
        session: NegotiationSession,
        round: number,
        suppliers: string[],
        procurement_parameters: ProcurementParameters[],
        isSalesBot: boolean,
    ): Offer | void {
        // only calculate for round 0
        if (round !== 0) {
            return;
        }
        const { offers, rfq_items: rfqItems, bot_parameter: botParameters } = session;
        if (!botParameters) {
            return;
        }

        const { rfq_target_saving: targetSaving, saving_parameters: salesSaving } = botParameters;
        if (!isSalesBot && !this.shouldCalculate(offers, (suppliers || []).length, 0)) {
            return;
        }
        // calculate bot total
        const itemAndLowestPrice = new Map<string, { q: number; price: number; baseline_price: number }>();
        // store bot items with targeted price
        rfqItems.forEach((item) => {
            itemAndLowestPrice.set(item.id, {
                q: isSalesBot
                    ? roundNearest(
                          Math.round(item.baseline_quantity * (1 + salesSaving.quantity / 100)),
                          item.baseline_quantity,
                          Math.round(item.baseline_quantity * (1 + salesSaving.quantity / 100)) * 10,
                          (botParameters.step_count || {}).quantity || Constant.StepCount.quantity,
                      )
                    : item.baseline_quantity,
                price: isSalesBot ? item.catalog_price : item.baseline_price * (1 - targetSaving / 100),
                baseline_price: item.baseline_price,
            });
        });

        // now do it for every offers
        (offers || []).forEach((offer) => {
            offer.rfq_offer.rfq_items.forEach((item) => {
                let olderValues = {
                    q: item.baseline_quantity,
                    price: item.baseline_price,
                    baseline_price: item.baseline_price,
                };
                if (itemAndLowestPrice.has(item.id)) {
                    olderValues = itemAndLowestPrice.get(item.id);
                    const value = Math.min(item.baseline_price, olderValues.price);
                    const floorvalue =
                        olderValues.baseline_price * (1 - (targetSaving / 100) * env.FLOOR_VALUE_SAVING_TARGET);
                    olderValues.price = Math.max(floorvalue, value);
                }
                itemAndLowestPrice.set(item.id, olderValues);
            });
        });

        const offer = this.initiateBotOffer(round, botParameters.max_concession_round, isSalesBot);
        offer.total = Util.round(
            [...itemAndLowestPrice.values()].reduce((p, c) => p + c.price * c.q, 0),
            2,
        );
        const { data } = isSalesBot ? this.metaService.salesBotSchema() : this.metaService.botSchema();
        const { procurement_parameters: parametersSchema } = data;

        // depending on if parameter is inverse or not. If inverse, pick max else min (procurement min is better)
        offer.rfq_offer = {
            rfq_parameters: (procurement_parameters || []).map((p) => {
                const schema = (parametersSchema || []).find((ps) => p.name === ps.name);
                const [min, max] = p.value !== undefined ? (p.value as number[]) : [0, 1];
                return {
                    value: schema.is_inverse ? min : max,
                    rawValue: schema.is_inverse ? min : max,
                    name: p.name,
                    label: schema.label,
                };
            }),
            rfq_items: rfqItems.map((ri) => ({
                ...ri,
                baseline_price: itemAndLowestPrice.get(ri.id).price,
                baseline_quantity: itemAndLowestPrice.get(ri.id).q,
            })),
        };
        return offer;
    }

    public canSupplierBid(
        round: number,
        offers: Offer[],
        supplierId: string,
        roundDeadline: Date,
        is_bot_active: boolean,
    ): boolean {
        // supplier can bid if he has not made an offer yet on this round
        const hasAlreadyBid = offers.some((o) => o.round === round && o.supplier_id === supplierId);
        if (hasAlreadyBid) {
            return false;
        }
        const now = new Date();
        const deadlineFlag = now <= roundDeadline;

        if (!is_bot_active && !deadlineFlag) return true;

        return deadlineFlag;
    }

    private whoIsNext(
        rfq: RfqResponse,
        round: number,
        offers: Offer[],
        supplierId: string,
        roundDeadline: Date,
        status: RfqStatus,
        validSuppliers: string[],
        is_bot_active: boolean,
    ): string {
        if (status !== RfqStatus.active) {
            return 'bot';
        }
        // check if this supplier is valid
        const isValidSupplier = validSuppliers.some((id) => id === supplierId);
        if (!isValidSupplier) {
            return 'bot';
        }
        const whoIsNext = this.canSupplierBid(round, offers, supplierId, roundDeadline, is_bot_active)
            ? 'supplier'
            : 'bot';
        const isRoundComplete = this.isRoundComplete(round, offers, validSuppliers.length);
        if (whoIsNext === 'bot' && isRoundComplete === false) {
            return 'bot';
        }
        return 'supplier';
    }

    public getBaselineOffer(offers: Offer[]): Offer {
        return offers.find((o) => (o.by === 'bot' || o.by === 'copilot') && o.round === 0);
    }

    private calculate({
        max,
        min,
        offered,
        weight,
        inverse,
    }: {
        max: number;
        min: number;
        offered: number;
        weight: number;
        inverse: boolean;
    }): number {
        if (isNaN(offered)) {
            return 0;
        }
        const divider = max !== min ? max - min : 1;
        const numerator = weight * (inverse === false ? offered - min : max - offered);
        const score = Util.round(numerator / divider, 2);
        return score;
    }

    private calculateFormula({
        max,
        min,
        offered,
        weight,
        inverse,
    }: {
        max: number;
        min: number;
        offered: number;
        weight: number;
        inverse: boolean;
    }): string {
        if (isNaN(offered)) {
            return 'nothing';
        }
        const divider = max !== min ? max - min : 1;
        const numerator = weight * (inverse === false ? offered - min : max - offered);
        const score = Util.round(numerator / divider, 2);
        return `score: ${score} \n  
        ${weight} * inverse ${inverse}  offered  ${offered} - min${min}   : ${max}max-  ${offered}offered <<<<<<<<<<<<\n
        numerator : ${numerator}    
        divider : ${divider}
        max !== min: ${max !== min}
        max - min: ${max - min}
        max ${max}
        min ${min}
        `;
    }

    public calculateUtilityScore(session: NegotiationSession, offer: Offer, isSalesBot?: boolean): void {
        const baseline = this.getBaselineOffer(session.offers);

        if (!baseline && !isSalesBot) {
            return;
        }
        // transform all parameters in this form to calculate utility score:
        // {name, max, min, offered, weight, inverse}
        const { data } = isSalesBot ? this.metaService.salesBotSchema() : this.metaService.botSchema();
        const { procurement_parameters: parametersSchema } = data;
        const weights = [],
            scores = [];

        const isRoundZeroOrBotOffer = baseline && offer.by === 'bot';

        (offer.rfq_offer.rfq_parameters || []).forEach((p) => {
            const botParameter = session.bot_parameter.procurement_parameters.find((bp) => bp.name === p.name);
            const schema = parametersSchema.find((ps) => p.name === ps.name);
            let actualValue = p.value;
            if ((schema as ProcurementParameterFieldWithBoolean).type === 'checkbox') {
                actualValue = p.value === true ? 1 : 0;
            }
            // if there is no botParameter value means it is boolean type in that case use 0 and 1 as min/max
            const [min, max] = !botParameter.value
                ? [0, 1]
                : Array.isArray(botParameter.value)
                ? botParameter.value
                : [botParameter.value, botParameter.value];

            p.util_score = this.calculate({
                weight: +botParameter.weight,
                inverse: schema.is_inverse,
                max: +max,
                min: +min,
                offered: +actualValue,
            });
            p.util_score_formula = this.calculateFormula({
                weight: +botParameter.weight,
                inverse: schema.is_inverse,
                max: +max,
                min: +min,
                offered: +actualValue,
            });
            weights.push(+botParameter.weight);
            scores.push(p.util_score);
        });
        // calculate for price as well
        const { rfq_items: rfqItems } = session;
        let averagePriceScore = 0;
        let formulatorOffer = '';
        const initialRfqTotal = rfqItems.reduce(
            (partialSum, a) => partialSum + +a.baseline_price * +a.baseline_quantity,
            0,
        );
        if (isRoundZeroOrBotOffer && !isSalesBot) {
            averagePriceScore = this.calculate({
                min: isSalesBot ? initialRfqTotal : baseline.total,
                max: isSalesBot ? baseline.total : initialRfqTotal,
                weight: +session.bot_parameter.price.weight,
                inverse: isSalesBot ? false : true,
                offered: offer.total,
            });
            formulatorOffer = this.calculateFormula({
                min: isSalesBot ? initialRfqTotal : baseline.total,
                max: isSalesBot ? baseline.total : initialRfqTotal,
                weight: +session.bot_parameter.price.weight,
                inverse: isSalesBot ? false : true,
                offered: offer.total,
            });
        } else {
            let totalPriceScore = 0;
            offer.rfq_offer.rfq_items.forEach((item) => {
                item.util_score = this.calculate({
                    min: isSalesBot
                        ? rfqItems.find((ri) => ri.id === item.id).baseline_price
                        : baseline.rfq_offer.rfq_items.find((ri) => ri.id === item.id).baseline_price,
                    max: isSalesBot
                        ? baseline.rfq_offer.rfq_items.find((ri) => ri.id === item.id).baseline_price
                        : rfqItems.find((ri) => ri.id === item.id).baseline_price,
                    weight: +session.bot_parameter.price.weight,
                    inverse: isSalesBot ? false : true,
                    offered: item.baseline_price,
                });
                item.util_score_formula = this.calculateFormula({
                    min: isSalesBot
                        ? rfqItems.find((ri) => ri.id === item.id).baseline_price
                        : baseline.rfq_offer.rfq_items.find((ri) => ri.id === item.id).baseline_price,
                    max: isSalesBot
                        ? baseline.rfq_offer.rfq_items.find((ri) => ri.id === item.id).baseline_price
                        : rfqItems.find((ri) => ri.id === item.id).baseline_price,
                    weight: +session.bot_parameter.price.weight,
                    inverse: isSalesBot ? false : true,
                    offered: item.baseline_price,
                });
                if (isSalesBot) {
                    item.quantity_util_score = this.calculate({
                        min: rfqItems.find((ri) => ri.id === item.id).baseline_quantity,
                        max: baseline.rfq_offer.rfq_items.find((ri) => ri.id === item.id).baseline_quantity,
                        weight: +session.bot_parameter.quantity.weight,
                        inverse: false,
                        offered: item.baseline_quantity,
                    });
                }
                totalPriceScore += isSalesBot ? item.util_score + Number(item.quantity_util_score) : item.util_score;
            });

            averagePriceScore = totalPriceScore / offer.rfq_offer.rfq_items.length;
        }
        // now that all price and procurement params have been calculated, do a sum to find total utility score
        weights.push(session.bot_parameter.price.weight);

        scores.push(averagePriceScore);
        offer.price_utility_score = Util.round(averagePriceScore, 2);
        offer.formulatorOffer = formulatorOffer;
        offer.utility_score = Util.round(Util.sum(scores), 2);
    }

    public async transformData(
        negotiation: Negotiation,
        rfq: Rfq,
    ): Promise<{
        channel_id: string;
        rfq: Rfq;
        rfq_number: string;
        rfq_id: string;
        customer: Customer;
        products: Product[];
        updated_date: Date;
        session: NegotiationSession;
        status: string;
        nego: Negotiation;
    }> {
        // products: products,

        const customer = await getRepository(Customer).findOne({ where: { id: negotiation.customer_id } });
        let products = await getRepository(Product)
            .createQueryBuilder('product')
            .innerJoinAndSelect('product.tenant', 'tenant')
            .where(`product.id in (:...ids)`, {
                ids: rfq.product_ids.length ? rfq.product_ids : [''],
            })
            .orderBy('product.updated_date', 'DESC')
            .getMany();

        const parameters = await getRepository(ProductParameter)
            .createQueryBuilder('parameter')
            .andWhere(`parameter.product_id in (:...ids)`, {
                ids: rfq.product_ids.length ? rfq.product_ids : [''],
            })
            .getMany();
        products = products.map((pr) => {
            pr.parameter = parameters.find((p) => p.product_id === pr.id) || null;
            if (!pr.parameter.step_count) {
                pr.parameter.step_count = {
                    price: negotiation?.session?.bot_parameter?.step_count?.price || Constant.StepCount.price,
                    quantity: negotiation?.session?.bot_parameter?.step_count?.quantity || Constant.StepCount.quantity,
                };
            }
            return pr;
        });

        const formattedRfqNumber = NegotiationSessionResponse.getORDNumber(Number(rfq.rfq_number));

        return {
            channel_id: negotiation.channel_id,
            rfq: rfq,
            rfq_number: formattedRfqNumber,
            rfq_id: rfq.id,
            customer: customer,
            products,
            updated_date: negotiation.updated_date,
            session: negotiation.session,
            status: negotiation.status,
            nego: negotiation,
        };
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

    public async getById(id: string, user?: RequestUserResponse): Promise<ResponseViewModel<Record<string, unknown>>> {
        try {
            const rfq = await this.rfqService.getById(id, user);
            if (ResponseViewModel.hasErrors(rfq)) {
                return ResponseViewModel.withErrorModels(rfq.errors);
            }
            let negotiation = await getRepository(Negotiation).findOne({ rfq_id: id });
            const suppliers = (await this.rfqSupplierService.getSuppliers([id])) || [];
            const isRfqSupplier =
                this.isAdminRole(user.role) || suppliers.some((s) => s.supplier_id === user.supplier_id);
            if (!isRfqSupplier) {
                return ResponseViewModel.withError('Invalid RFQ.');
            }
            if (!negotiation) {
                // get all suppliers and store as valid suppliers
                negotiation = new Negotiation();
                negotiation.session = new NegotiationSession();
                negotiation.session.bot_parameter = rfq.data.parameter;
                negotiation.session.rfq_items = rfq.data.items;
                negotiation.session.offers = [];
                negotiation.rfq_id = id;
                negotiation.id = Util.guid();
                negotiation.is_bot_active = true;
                negotiation.status = SessionStatus.in_progress;
                negotiation.valid_supplier_ids = suppliers.map((s) => s.supplier_id);
                await getRepository(Negotiation).save(negotiation);
            }

            const currentRound = this.getCurrentRound(negotiation.session.offers);
            const isRoundComplete = this.isRoundComplete(
                currentRound,
                negotiation.session.offers,
                negotiation.valid_supplier_ids.length,
            );
            // ? this.isRoundComplete(currentRound, negotiation.session.offers, negotiation.valid_supplier_ids.length)
            // : true;
            const newRound = isRoundComplete ? currentRound + 1 : currentRound;
            const roundDeadline = new Date(rfq.data.negotiation_process.deadlines[newRound]);
            const next = this.whoIsNext(
                rfq.data,
                newRound,
                negotiation.session.offers,
                user.supplier_id,
                roundDeadline,
                rfq.data.status as RfqStatus,
                negotiation.valid_supplier_ids,
                negotiation.is_bot_active,
            );
            negotiation.session.offers = negotiation.session.offers.filter(
                (o) =>
                    o.by === 'bot' ||
                    o.by === 'copilot' ||
                    (o.supplier_id === user.supplier_id && user.role === Roles.supplier) ||
                    this.isAdminRole(user.role),
            );
            const suppliersData = await this.supplierService.getLightweightBySupplierIds(
                suppliers.map((s) => s.supplier_id),
            );
            negotiation.session.offers.forEach((o) => {
                if (o.by === 'supplier') {
                    const supplier = suppliersData.find((s) => s.id === o.supplier_id);
                    o.supplier_name = (supplier || { name: '' }).name;
                }
            });
            // remove the last bot offer if the supplier is invalid and bot has made an offer
            this.removeLastBotOfferIfInvalidSupplier(user, negotiation);
            const { data: initial } = rfq;
            // read currency from first item
            const currency = ((negotiation.session.rfq_items || []).find(() => true) || { currency: 'USD' }).currency;
            const isSupplierWon = initial && initial.winner_supplier_id === user.supplier_id;
            let negotiationMessage = isSupplierWon
                ? BotResultMessage.NegotiationMessage.won
                : BotResultMessage.NegotiationMessage.lost;

            const timeZone = await this.orgService.getOrganisationTimeZone(rfq.data.organisation_id);

            const deadlineApproachingDiff = (roundDeadline.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24);
            const hasSupplierOfferForRound = negotiation.session.offers.some(
                (offer) => offer.supplier_id === user.supplier_id && offer.round === negotiation.round,
            );
            negotiationMessage =
                deadlineApproachingDiff > 0 && deadlineApproachingDiff < 1 && !hasSupplierOfferForRound
                    ? BotResultMessage.NegotiationMessage.rfqDeadline.replace(
                          '{{RFQ_next_round_deadline}}',
                          this.mailService.toTimeZone(new Date(roundDeadline), timeZone).toString().toLocaleString(),
                      )
                    : initial.status === RfqStatus.active
                    ? ''
                    : negotiationMessage;

            let rfqStatusAfterAward: string[] = [RfqStatus.active, RfqStatus.won, RfqStatus.lost];

            const organisation = await getRepository(Organisation).findOne({
                organisation_id: initial.organisation_id,
            });

            // Setting utility score in multiple of 100
            negotiation &&
                negotiation.session &&
                (negotiation.session.offers || []).forEach((o) => {
                    o.price_utility_score = Util.round(o.price_utility_score * 100, 2);
                    o.utility_score = Util.round((o.utility_score as number) * 100, 2);
                });

            // If supplier rejects rfq, returns back this negotiationMessage till status become 'awarded'
            const rejectAcceptHistory = negotiation && negotiation.session && negotiation.session.rfq_history;
            const completedAndAwardRequested: string[] = [RfqStatus.completed, RfqStatus.awardrequested];
            if (rejectAcceptHistory && completedAndAwardRequested.includes(initial.status)) {
                const isUserRejected = rejectAcceptHistory.some(
                    (r) => r.by === user.supplier_id && r.action === 'rejected',
                );
                negotiationMessage = isUserRejected
                    ? BotResultMessage.NegotiationMessage.rfqReject
                    : negotiationMessage;
                rfqStatusAfterAward = isUserRejected
                    ? [...rfqStatusAfterAward, ...completedAndAwardRequested]
                    : rfqStatusAfterAward;
            }

            const response = {
                rfq: {
                    rfq_number: initial.rfq_number,
                    id: initial.id,
                    winner_supplier_id: initial.winner_supplier_id,
                    status: initial.status,
                    suppliers: suppliers,
                    valid_supplier_ids: negotiation.valid_supplier_ids,
                    deadline: rfq.data?.negotiation_process?.deadlines,
                },
                session: negotiation.session,
                supplier_id: user.supplier_id,
                is_bot_active: negotiation.is_bot_active,
                next,
                currency,
                negotiationMessage: rfqStatusAfterAward.includes(initial.status) ? negotiationMessage : '',
                organisationName: organisation.name,
                clientMessages: organisation.organisation_settings?.client_messages,
            };
            return ResponseViewModel.with(response);
        } catch (error) {
            return ResponseViewModel.withError('Something went wrong .');
        }
    }

    private removeLastBotOfferIfInvalidSupplier(user: RequestUserResponse, negotiation: Negotiation) {
        const { offers } = negotiation.session;
        if (user.role !== Roles.supplier || negotiation.valid_supplier_ids.indexOf(user.supplier_id) > -1) {
            return;
        }
        const lastOfferIsByBot = offers.length > 0 && offers[offers.length - 1].by === 'bot';
        if (!lastOfferIsByBot) {
            return;
        }
        offers.pop();
    }

    private isAdminRole(role: string): boolean {
        return role === Roles.enterprise_admin || role === Roles.enterprise_user;
    }
}
