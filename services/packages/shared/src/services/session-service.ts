import {
    RequestUserResponse,
    EmbedCustomerAuthenticationResponse as TokenResponse,
    NegotiationSessionResponse,
    SuccessResponse,
    PaginatedResponseModel,
    NegotiationLightWeightResponse,
} from '../viewmodels/response';
import { getRepository, SelectQueryBuilder, getConnection } from 'typeorm';

import { ErrorModel, ResponseViewModel } from '../viewmodels/response-viewmodel';
import { injectable, inject } from 'inversify';
import { ProductServiceContract } from './product-service';
import { ProductParameterServiceContract } from './product-parameter-service';
import { Negotiation } from '../database/models/negotiation';
import { BotServiceContract } from './bot-service';
import { BusinessType, Roles, SessionStatus, RfqStatus } from '../enum';
import { ChannelFactory, eventSink, HandshakeFactory } from '../factories';
import { Constant, Util } from '../helpers';
export { RfqService } from './rfq-service';
import { BotProductAndParameterWithTenantUsers, NegotiationSession, Offer, WebhooksEvent } from '../types';
import { AgentMakeOfferRequest, CreateSessionRequest, RfqRequest, SessionRequest } from '../viewmodels/requests';
import { ChannelStatus, ChannelStatusResponse } from '../types';
import { CustomerServiceContract } from './customer-service';
import { TwilioServiceContract } from './twilio-service';
import { OfferParameters, SimpleOfferResponse } from '../viewmodels/response/negotiation-response';
import { ParameterConfiguration } from '../types/parameter-configuration';
import { Bootstrapper } from '../bootstrap/bootstrapper';
import { RfqServiceContract } from './rfq-service';
import { Product, ProductParameter, Rfq } from '../database/models';
import { RfqNegotiationServiceContract } from './rfq-negotiation-service';
import { OrganisationServiceContract } from './organisation-service';
import { RfqResponseItem } from '../viewmodels/response/rfq-response';
import console = require('console');
import { RfqSalesNegotiationServiceContract } from './rfq-sales-negotiation-service';
// import { ActionServiceContract } from './action-service';
export interface SessionServiceContract {
    createOrUpdateSession(
        user: RequestUserResponse,
        sessionRequest: CreateSessionRequest,
    ): Promise<ResponseViewModel<TokenResponse>>;
    getByChannelId(channelId: string): Promise<ResponseViewModel<Negotiation>>;
    get(
        filterRequest: SessionRequest,
        organisationId: string,
        userId: string,
        tenantId: string,
    ): Promise<ResponseViewModel<PaginatedResponseModel<NegotiationSessionResponse>>>;
    agentAcceptOffer(negotiationId: string, user: RequestUserResponse): Promise<ResponseViewModel<SuccessResponse>>;
    agentRejectOffer(negotiationId: string, user: RequestUserResponse): Promise<ResponseViewModel<SuccessResponse>>;
    agentMakeOffer(
        user: RequestUserResponse,
        request: AgentMakeOfferRequest,
    ): Promise<ResponseViewModel<SuccessResponse>>;
    getSessionByChannelId(
        channelId: string,
        user: RequestUserResponse,
    ): Promise<ResponseViewModel<NegotiationLightWeightResponse>>;
}

@injectable()
export class SessionService implements SessionServiceContract {
    channelService: TwilioServiceContract;
    public constructor(
        @inject('BotService') private readonly botService: BotServiceContract,
        @inject('RfqNegotiationService') private readonly rfqNegotiationService: RfqNegotiationServiceContract,
        @inject('OrganisationService') private readonly organisationService: OrganisationServiceContract,
        @inject('ProductService') private readonly productService: ProductServiceContract,
        @inject('ProductParameterService') private readonly productParameterService: ProductParameterServiceContract,
        @inject('CustomerService') private readonly customerService: CustomerServiceContract,
    ) {
        this.channelService = ChannelFactory.get();
    }

    private async getSessionAttributes(
        productCode: string,
        organisationId: string,
        tenantId: string,
    ): Promise<ResponseViewModel<BotProductAndParameterWithTenantUsers>> {
        const response = new ResponseViewModel<BotProductAndParameterWithTenantUsers>();
        const organisation = await this.organisationService.getById(organisationId);
        const productResponse = await this.productService.getByproductCode(productCode, organisationId, tenantId);
        // get product by product code
        if (ResponseViewModel.hasErrors(productResponse)) {
            response.data = {
                botParameter: null,
                product: null,
                parameters: null,
                clientMessages: organisation.data.organisation_settings?.client_messages,
            };
            response.errors = productResponse.errors;

            return response;
        }
        const product = productResponse.data;

        // const tenantId = product.tenant_id;

        // product parameter with org id
        const productParametersResponse = await this.productParameterService.getProductParameters(
            organisationId,
            product.id,
        );
        if (ResponseViewModel.hasErrors(productParametersResponse)) {
            response.errors = productParametersResponse.errors;

            return response;
        }

        // get bot parameter
        const botParametersResponse = await this.botService.getOrganisationBot(
            organisationId,
            BusinessType.sales,
            product.tenant_id,
            product.category_id,
        );
        if (ResponseViewModel.hasErrors(botParametersResponse)) {
            response.errors = botParametersResponse.errors;

            return response;
        }

        const productParameters = productParametersResponse.data;
        const hasPaymentTerms = Util.checkProductHasPaymentTerms(product, botParametersResponse.data.parameter);

        if (hasPaymentTerms) {
            const paymentTerms = botParametersResponse.data.parameter.payment_term_pattern;
            const min = paymentTerms[0];
            const max = paymentTerms[paymentTerms.length - 1];
            productParameters.push({
                inverse: true,
                min,
                max,
                weight: Constant.paymentTermsWeight,
                unit: 'DAYS',
                step: paymentTerms,
                name: Constant.paymentTermsField,
            });
        }

        // const tenantResponse = await this.tenantService.get(tenantId);

        // if (ResponseViewModel.hasErrors(tenantResponse)) {
        //     response.errors = tenantResponse.errors;

        //     return response;
        // }

        // const tenantUsersResponse = await this.tenantUserService.getUsersByTenantId(tenantId);

        // if (ResponseViewModel.hasErrors(tenantUsersResponse)) {
        //     response.errors = tenantUsersResponse.errors;

        //     return response;
        // }
        botParametersResponse.data.parameter.auto_accept_score =
            organisation.data.organisation_settings?.auto_accept_score;
        botParametersResponse.data.parameter.max_concession_score =
            organisation.data.organisation_settings?.max_concession_score;
        botParametersResponse.data.parameter.bot_counter_offer_delay =
            organisation.data.organisation_settings?.bot_counter_offer_delay;
        botParametersResponse.data.parameter.floor_value_saving_target =
            organisation.data.organisation_settings?.floor_value_saving_target;
        botParametersResponse.data.parameter.step_count = organisation.data.organisation_settings?.step_count;
        response.data = {
            botParameter: botParametersResponse.data.parameter,
            product: product,
            parameters: productParameters,
            clientMessages: organisation.data.organisation_settings?.client_messages,
        };

        return response;
    }

    public async getCustomerAllChannelsStatus(
        rfqId: string[],
        sessionAttributes: BotProductAndParameterWithTenantUsers,
        defaultChannelId?: string,
        page?: number,
    ): Promise<ChannelStatusResponse> {
        const [sessions, totalItems] = await getConnection()
            .getRepository(Negotiation)
            .createQueryBuilder('nego')
            .leftJoinAndSelect('nego.rfq', 'rfq')
            .innerJoinAndSelect('nego.customer', 'customer')
            .where(`nego.rfq_id in (:...ids)`, { ids: rfqId.length ? rfqId : [''] })
            .skip((page - 1) * Constant.saasNegotiationPageSize)
            .take(Constant.saasNegotiationPageSize)
            .orderBy('nego.updated_date', 'DESC')
            .getManyAndCount();
        let channelStatus: ChannelStatus[] = [];
        const list: string[] = [];
        await Promise.all(
            sessions.map(async (session) => {
                if (!list.includes(session.channel_id)) {
                    list.push(session.channel_id);
                    const products = await getConnection()
                        .getRepository(Product)
                        .createQueryBuilder('product')
                        .innerJoinAndSelect('product.tenant', 'tenant')
                        .where(`product.id in (:...ids)`, {
                            ids: session.rfq.product_ids.length ? session.rfq.product_ids : [''],
                        })
                        .orderBy('product.updated_date', 'DESC')
                        .getMany();
                    const parameters = await getRepository(ProductParameter)
                        .createQueryBuilder('parameter')
                        .andWhere(`parameter.product_id in (:...ids)`, {
                            ids: session.rfq.product_ids.length ? session.rfq.product_ids : [''],
                        })
                        .getMany();

                    products.map((pr) => {
                        pr.parameter = parameters.find((p) => p.product_id === pr.id) || null;
                        if (!pr.parameter.step_count) {
                            pr.parameter.step_count = {
                                price: sessionAttributes?.botParameter?.step_count?.price || Constant.StepCount.price,
                                quantity:
                                    sessionAttributes?.botParameter?.step_count?.quantity ||
                                    Constant.StepCount.quantity,
                            };
                        }
                        return pr;
                    });
                    const formattedRfqNumber = NegotiationSessionResponse.getORDNumber(Number(session.rfq.rfq_number));

                    channelStatus.push({
                        channel_id: session.channel_id,
                        rfq: session.rfq,
                        rfq_number: formattedRfqNumber,
                        products: products,
                        customer: session.customer,
                        default: defaultChannelId === session.channel_id,
                        status: session.status,
                        updated_date: session.updated_date,
                        session: session.session,
                        client_messages: sessionAttributes?.clientMessages,
                        nego: session,
                    });
                }
            }),
        );
        channelStatus = channelStatus.sort(function (a, b) {
            return new Date(b.updated_date).valueOf() - new Date(a.updated_date).valueOf();
        });
        if (defaultChannelId) {
            const topChannel = channelStatus.find((ch) => ch.channel_id === defaultChannelId);
            channelStatus.splice(
                channelStatus.findIndex((c) => c.channel_id === defaultChannelId),
                1,
            );
            channelStatus.unshift(topChannel);
        }
        const channelStatusResponse = {
            channel_status: channelStatus,
            totalItems,
        };
        return channelStatusResponse;
    }

    private async setUserIsOnChannel(role: string, userId: string): Promise<boolean> {
        const service = HandshakeFactory.getServiceByUserRole(role);
        return await service.setUserIsOnChannel(userId);
    }

    private getTokenResponseForCustomer(
        user: RequestUserResponse,
        customerChannels: ChannelStatusResponse,
    ): TokenResponse {
        const identity = `${user.user_id}-${user.organisation_id}`;
        const token = this.channelService.createAccessToken(identity);
        const channels = customerChannels;
        return {
            token,
            channels: channels.channel_status,
            totalItems: channels.totalItems,
        };
    }

    public async createOrUpdateSession(
        user: RequestUserResponse,
        sessionRequest: CreateSessionRequest,
    ): Promise<ResponseViewModel<TokenResponse>> {
        try {
            const page = +(sessionRequest.page || 1) > 0 ? +(sessionRequest.page || 1) : 1;
            const container = Bootstrapper.getContainer();
            const rfqService = container.get<RfqServiceContract>('RfqService');
            const negoService = container.get<RfqNegotiationServiceContract>('RfqNegotiationService');
            const salesNegoService = container.get<RfqSalesNegotiationServiceContract>('RfqSalesNegotiationService');
            let negotiation: Negotiation = null;
            const channelId = Util.guid();
            const response = new ResponseViewModel<TokenResponse>();
            // const userId = user.user_id;
            const organisationId = user.organisation_id;
            const {
                history,
                product_id: productCode,
                buyer_id: buyerId,
                supplier_id: SupplierId,
                product_supplier_id: productSupplierId,
                rfqId: rfqId,
                payload: payload,
                exitNegotiation: exitNegotiation,
                accept: negotiationAccept,
            } = sessionRequest;

            if (rfqId) {
                const result = await salesNegoService.negotiateSalesBot(
                    rfqId,
                    payload,
                    exitNegotiation,
                    negotiationAccept,
                    user,
                );
                response.data = { session: result };
                return response;
            }
            const tenantId = user.tenant_id;
            const sessionAttributesResponse = await this.getSessionAttributes(productCode, organisationId, tenantId);

            // user role is not customer or history is true, return directly twilio token
            if (user.role !== Roles.customer || history) {
                const allRfqs = buyerId ? await this.getAllRfqs(buyerId) : await this.getAllRfqsForSupplier(SupplierId);
                const customerChannels = await this.getCustomerAllChannelsStatus(
                    allRfqs.map((r) => r.id),
                    sessionAttributesResponse.data,
                    '',
                    page,
                );
                response.data = this.getTokenResponseForCustomer(user, customerChannels);
                return response;
            }
            if (ResponseViewModel.hasErrors(sessionAttributesResponse)) {
                response.errors = sessionAttributesResponse.errors;

                return response;
            }

            const sessionAttributes: BotProductAndParameterWithTenantUsers = sessionAttributesResponse.data;
            const { product } = sessionAttributes;

            const rfqStatus = await this.checkRfqStatus(buyerId, product.id);
            let salesSaving = null;
            // if true still negotiation is in progress for
            // this products+buyer+
            // we can create new rfq only after rfq  is completed
            if (product.is_manual_nego) {
                sessionAttributes.botParameter.saving_parameters = product.productParameter.saving_parameters;
                sessionAttributes.botParameter.step_count = product.productParameter.step_count;
                salesSaving = product.productParameter.saving_parameters;
            } else {
                salesSaving = (sessionAttributes.botParameter || {}).saving_parameters;
            }
            if (!salesSaving) return ResponseViewModel.withError('Invalid Saving parameters');

            if (!rfqStatus) {
                try {
                    const newRfq: RfqRequest = {
                        items: [
                            {
                                product_id: product.id,
                                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                                // @ts-ignore
                                id: product.id,
                                product_name: product.name,
                                name: product.name,
                                baseline_price: Math.round(product.price * (1 - salesSaving.price / 100)),
                                catalog_price: product.price,
                                baseline_quantity: product.quantity,
                                uom: product.uom,
                                currency: product.currency,
                                is_quantity_negotiable: false,
                                category_id: product.category_id,
                            },
                        ],
                        buyerId: buyerId,
                        supplierId: productSupplierId,
                        updated_by: user.user_id,
                        organisation_id: user.organisation_id,
                        created_by: user.user_id,
                        status: 'active',
                    };
                    const createdRfq = await rfqService.update(newRfq, {
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

                    negotiation = await this.store(user, sessionAttributes, channelId, createdRfq.data.id, buyerId);
                    const botOffer = await salesNegoService.calculateBotOffer(
                        negotiation.session,
                        negotiation.round,
                        negotiation.valid_supplier_ids,
                        (negotiation.session.bot_parameter || { procurement_parameters: null }).procurement_parameters,
                        createdRfq.data.id,
                    );
                    if (botOffer) {
                        negotiation.session.offers.push(botOffer);
                        negoService.calculateUtilityScore(negotiation.session, botOffer, true);
                    }
                    await getRepository(Negotiation).save(negotiation);
                } catch (error) {
                    console.log(error);
                }
            } else {
                negotiation = rfqStatus;
            }

            await this.setUserIsOnChannel(user.role, user.user_id);
            const allRfqs = await this.getAllRfqs(buyerId);
            const customerChannels = await this.getCustomerAllChannelsStatus(
                allRfqs.map((r) => r.id),
                sessionAttributesResponse.data,
                negotiation?.channel_id,
                page,
            );
            response.data = this.getTokenResponseForCustomer(user, customerChannels);
            return response;
        } catch (error) {
            console.log(error, 'error**********88');
        }
    }

    private async store(
        user: RequestUserResponse,
        sessionAttributes: BotProductAndParameterWithTenantUsers,
        channelId: string,
        rfq_id?: string,
        buyer_id?: string,
    ): Promise<Negotiation> {
        const negotiation = new Negotiation();
        const { botParameter, parameters, product } = sessionAttributes;
        negotiation.id = Util.newId();
        negotiation.rfq_id = rfq_id;
        negotiation.customer_id = user.user_id;
        negotiation.product_id = sessionAttributes.product.id;
        negotiation.channel_id = channelId;
        negotiation.round = 0;
        negotiation.valid_supplier_ids = [buyer_id];
        negotiation.is_bot_active = true;
        const { saving_parameters: salesSaving } = botParameter;

        negotiation.session = {
            bot_parameter: botParameter,
            product_parameters: parameters,
            offers: [],
            rfq_history: [],
            rfq_items: [
                {
                    id: product.id,
                    product_id: product.id,
                    name: product.productInfo.name,
                    baseline_price: Math.round(product.price * (1 - salesSaving.price / 100)),
                    catalog_price: product.price,
                    baseline_quantity: product.quantity,
                    uom: product.uom,
                    currency: product.currency,
                    is_quantity_negotiable: true,
                },
            ],
        };
        negotiation.product_code = product.product_code;
        negotiation.status = SessionStatus.init;
        await getRepository(Negotiation).save(negotiation);

        return negotiation;
    }

    private async checkRfqStatus(buyerId: string, productId: string): Promise<Negotiation> {
        const session = getRepository(Negotiation)
            .createQueryBuilder('nego')
            .innerJoinAndSelect('nego.rfq', 'rfq')
            .innerJoin('nego.product', 'product')
            .where('rfq.buyer_id = :buyerId', { buyerId })
            .andWhere(`rfq.product_ids @> :productIds`, {
                productIds: JSON.stringify([productId]),
            })
            .andWhere('nego.status in (:...status)', {
                status: ['in_progress', 'init', 'customer_accepted'],
            })
            .orderBy('rfq.created_date', 'DESC')
            .getOne();
        return session;
    }

    private async getAllRfqs(buyerId: string): Promise<Rfq[]> {
        const session = await getRepository(Rfq)
            .createQueryBuilder('rfq')
            .where('rfq.buyer_id = :buyerId', { buyerId })
            .orderBy('rfq.created_date', 'DESC')
            .getMany();

        return session;
    }

    private async getAllRfqsForSupplier(supplierId: string): Promise<Rfq[]> {
        const session = await getRepository(Rfq)
            .createQueryBuilder('rfq')
            .where('rfq.supplier_id = :supplierId', { supplierId })
            .orderBy('rfq.created_date', 'DESC')
            .getMany();

        return session;
    }

    // private async getUserLastSession(rfqId: string): Promise<Negotiation> {
    //     const session = await getRepository(Negotiation)
    //         .createQueryBuilder('nego')
    //         // .select([
    //         //     'nego.id',
    //         //     'nego.channel_id',
    //         //     'nego.status',
    //         //     'nego.session',
    //         //     'nego.customer_id',
    //         //     'nego.product_code',
    //         //     'nego.created_date',
    //         // ])
    //         .where('nego.rfq_id = :rfqId', { rfqId })
    //         .orderBy('nego.created_date', 'DESC')
    //         .getOne();

    //     return session;
    // }

    public async getByChannelId(channelId: string): Promise<ResponseViewModel<Negotiation>> {
        const negotiation = await getRepository(Negotiation).findOne({
            where: { channel_id: channelId },
            order: { created_date: 'DESC' },
        });
        if (negotiation) {
            return ResponseViewModel.with<Negotiation>(negotiation);
        }

        return ResponseViewModel.withError('invalid channel id');
    }

    private addFilterCondition<T>(query: SelectQueryBuilder<T>, filterRequest: SessionRequest): SelectQueryBuilder<T> {
        const status = filterRequest.status ?? '';
        const isBotActiveString = filterRequest.is_bot_active ?? '';
        const isBotActive = isBotActiveString ? isBotActiveString.toLowerCase() === 'true' : false;

        if (isBotActive) {
            query.andWhere('nego.is_bot_active = true');
        }
        if (isBotActiveString && !isBotActive) {
            query.andWhere('nego.is_bot_active = false');
        }
        if (status) {
            if (status === SessionStatus.open) {
                query.andWhere('nego.status in (:...openStatus)', { openStatus: Constant.openStatuses });
            } else if (status === SessionStatus.closed) {
                query.andWhere('nego.status in (:...closedStatus)', { closedStatus: Constant.closedStatuses });
            } else {
                query.andWhere('nego.status = :status', { status });
            }
        }

        return query;
    }

    public async get(
        filterRequest: SessionRequest,
        organisationId: string,
        userId: string,
        tenantId?: string,
    ): Promise<ResponseViewModel<PaginatedResponseModel<NegotiationSessionResponse>>> {
        tenantId = tenantId ?? null;
        const page = +(filterRequest.page || 1) > 0 ? +(filterRequest.page || 1) : 1;
        const query = getRepository(Negotiation)
            .createQueryBuilder('nego')
            .innerJoinAndSelect('nego.customer', 'customer')
            .innerJoin('nego.product', 'product')
            .innerJoinAndSelect('nego.rfq', 'rfq')
            .where('customer.organisation_id = :organisationId', { organisationId });
        if (tenantId) {
            query.andWhere(
                '(cast(:tenantId as varchar) is null and ("product"."tenant_id" is null) or (cast(:tenantId as varchar) is not null and "product"."tenant_id" = :tenantId))',
                { tenantId },
            );
        }
        this.addFilterCondition<Negotiation>(query, filterRequest);
        const [results, totalItems] = await query
            .skip((page - 1) * Constant.pageSize)
            .take(Constant.pageSize)
            .orderBy('nego.updated_date', 'DESC')
            .getManyAndCount();

        const organisation = (await this.organisationService.getById(organisationId)).data;

        const data = NegotiationSessionResponse.fromModels(results, organisation);
        const paginatedData = new PaginatedResponseModel<NegotiationSessionResponse>(data, totalItems, page);

        return ResponseViewModel.with<PaginatedResponseModel<NegotiationSessionResponse>>(paginatedData);
    }

    public async agentAcceptOffer(
        negotiationId: string,
        user: RequestUserResponse,
    ): Promise<ResponseViewModel<SuccessResponse>> {
        const negotiation = await getRepository(Negotiation).findOne(negotiationId);
        if (!negotiation) {
            return ResponseViewModel.withError('invalid session-id');
        }

        if (negotiation.status !== SessionStatus.customer_accepted) {
            return ResponseViewModel.withError(`Agent can accept status only if customer has accepted the offer}`);
        }
        const canAcceptResponse = await this.canAgentAcceptOrReject(negotiation, user);
        if (ResponseViewModel.hasErrors(canAcceptResponse)) {
            return ResponseViewModel.withErrorModels(canAcceptResponse.errors);
        }
        negotiation.status = SessionStatus.completed;
        const message = this.getAgentAcceptedMsg(negotiation.session, negotiation.product_code);
        negotiation.last_message = message;

        // await this.channelService.sendMessage(negotiation.channel_id, `${user.user_id}-${user.tenant_id}`, message);
        await getRepository(Negotiation).save(negotiation);
        this.offerAccepted(negotiation, user);

        return ResponseViewModel.withSuccess();
    }

    private offerAccepted(negotiation: Negotiation, user: RequestUserResponse): void {
        const lastOffer = negotiation.session.offers[negotiation.session.offers.length - 1].rfq_offer.rfq_items;
        const data: WebhooksEvent = {
            offer: { price: lastOffer[0].baseline_price, quantity: lastOffer[0].baseline_quantity },
            productCode: negotiation.product_code,
            tenantUserId: user.user_id,
            organisationId: user.organisation_id,
            customerId: negotiation.customer_id,
            tenantId: user.tenant_id,
        };
        eventSink.raiseEvent(Constant.NegotiationEvents.onOfferAccepted, data);
    }

    private offerRejected(negotiation: Negotiation, user: RequestUserResponse): void {
        const lastOffer = negotiation.session.offers[negotiation.session.offers.length - 1].rfq_offer.rfq_items;
        const data: WebhooksEvent = {
            productCode: negotiation.product_code,
            tenantUserId: user.user_id,
            organisationId: user.organisation_id,
            customerId: negotiation.customer_id,
            tenantId: user.tenant_id,
            offer: { price: lastOffer[0].baseline_price, quantity: lastOffer[0].baseline_quantity },
        };
        eventSink.raiseEvent(Constant.NegotiationEvents.onOfferRejected, data);
    }

    private async canAgentAcceptOrReject(
        negotiation: Negotiation,
        user: RequestUserResponse,
    ): Promise<ResponseViewModel<SuccessResponse>> {
        const customer = await this.customerService.getCustomerById(negotiation.customer_id);
        if (!customer || user.organisation_id !== customer.organisation_id) {
            return ResponseViewModel.withError('invalid session-id');
        }

        return ResponseViewModel.withSuccess();
    }

    public async agentRejectOffer(
        negotiationId: string,
        user: RequestUserResponse,
    ): Promise<ResponseViewModel<SuccessResponse>> {
        const negotiation = await getRepository(Negotiation).findOne(negotiationId);

        if (!negotiation) {
            return ResponseViewModel.withError('invalid session-id');
        }

        if (negotiation.status !== SessionStatus.customer_accepted) {
            return ResponseViewModel.withError(`Agent can reject status only if customer has accepted the offer}`);
        }

        const canRejectResponse = await this.canAgentAcceptOrReject(negotiation, user);
        if (ResponseViewModel.hasErrors(canRejectResponse)) {
            return ResponseViewModel.withErrorModels(canRejectResponse.errors);
        }

        negotiation.status = SessionStatus.rejected;
        const message = this.getAgentRejectedMsg();
        negotiation.last_message = message;

        // await this.channelService.sendMessage(negotiation.channel_id, `${user.user_id}-${user.tenant_id}`, message);
        await getRepository(Negotiation).save(negotiation);

        this.offerRejected(negotiation, user);
        return ResponseViewModel.withSuccess();
    }

    public async agentMakeOffer(
        user: RequestUserResponse,
        request: AgentMakeOfferRequest,
    ): Promise<ResponseViewModel<SuccessResponse>> {
        const sessionId = request.session_id;
        // const userTenantIdOrOrgId = user.tenant_id ? user.tenant_id : user.organisation_id;
        delete request.session_id;

        const negotiation = await getRepository(Negotiation).findOne(sessionId);
        await getRepository(Rfq).update({ id: negotiation.rfq_id }, { status: RfqStatus.active });

        if (!negotiation) {
            return ResponseViewModel.withErrorModels([new ErrorModel('invalid session_id', 'session_id')]);
        }
        const currentRound = this.rfqNegotiationService.getCurrentRound(negotiation.session.offers);

        const newRound = currentRound + 1;
        const payload = request.payload;
        const total = Util.round(
            (payload.rfq_items as RfqResponseItem[]).reduce(
                (p: number, c) => p + +c.baseline_price * +c.baseline_quantity,
                0,
            ),
            2,
        );

        const offer = new Offer();

        offer.by = 'supplier';
        offer.total = total;
        offer.round = newRound === 0 ? 1 : newRound;
        offer.at = new Date();
        offer.message = payload.comment;
        // if (payload.comment) {
        //     const negotiationComment = [
        //         {
        //             by: user.name as string,
        //             user_id: user.user_id as string,
        //             comment: payload.comment as string,
        //             at: offer.at as Date,
        //         },
        //     ];
        //     offer.comment = negotiationComment;
        // }
        delete payload.comment;

        offer.rfq_offer = payload as any;
        this.rfqNegotiationService.calculateUtilityScore(negotiation.session, offer, true);

        negotiation.session.offers.push(offer);
        negotiation.round = offer.round;
        negotiation.status = SessionStatus.in_progress;
        negotiation.is_bot_active = false;
        // const agentOffer = AgentMakeOfferRequest.offerObject(request, user.user_id);
        // agentOffer.round = negotiation.round + 1;
        // negotiation.session.offers.push(agentOffer);
        // negotiation.is_bot_active = false;
        // negotiation.round++;

        // const msg = await this.sendAgentMadeOffer(
        //     user,
        //     negotiation.channel_id,
        //     agentOffer,
        //     negotiation.session.product_parameters,
        // );
        // negotiation.last_message = msg;
        await getRepository(Negotiation).save(negotiation);
        // this.agentMadeOffer(negotiation, user);

        return ResponseViewModel.withSuccess();
    }

    private getAgentRejectedMsg(): SimpleOfferResponse {
        return {
            type: `simple`,
            text: `I am afraid we can no longer with this deal. I am very sorry for the inconvenience caused.`,
        };
    }

    private getAgentAcceptedMsg(session: NegotiationSession, productCode: string): SimpleOfferResponse {
        const { offers, product_parameters: productParameters, rfq_items: rfqItems } = session;
        const lastOffer = offers.slice(-1)[0];
        const parameterNameAndUnit = Util.getParameterWithUnit(productParameters);
        return {
            type: `simple`,
            text: `Thank you for your business! We confirm your offer with the following details<br />${Util.getProductDisplayName(
                rfqItems,
                productCode,
            )}<br />`,
            parameters: productParameters.map(
                (parameter: ParameterConfiguration): OfferParameters => {
                    const { name, unit } = parameter;
                    const value =
                        name === Constant.productParameters.price
                            ? lastOffer.rfq_offer.rfq_items[0].baseline_price
                            : lastOffer.rfq_offer.rfq_items[0].baseline_quantity;
                    return {
                        name: name,
                        unit: unit,
                        value,
                        display_name: Util.getParameterDisplayName(parameter.name),
                        quantity_unit:
                            name === Constant.productParameters.price
                                ? Util.getQuantityUnit(parameterNameAndUnit)
                                : null,
                    };
                },
            ),
        };
    }

    public async getSessionByChannelId(
        channelId: string,
        user: RequestUserResponse,
    ): Promise<ResponseViewModel<NegotiationLightWeightResponse>> {
        const negotiation = await getRepository(Negotiation).findOne({
            where: { channel_id: channelId },
            order: { created_date: 'DESC' },
        });

        if (!negotiation) {
            return ResponseViewModel.withError('invalid channel-id');
        }

        const { product } = negotiation.session;
        const productTenantOrOrgId = product.tenant_id ? product.tenant_id : product.organisation_id;
        const userTenantIdOrOrgId = user.tenant_id ? user.tenant_id : user.organisation_id;

        if (productTenantOrOrgId !== userTenantIdOrOrgId) {
            return ResponseViewModel.withErrorModels([
                new ErrorModel('you are not an authorized person', 'session_id'),
            ]);
        }

        return ResponseViewModel.with(NegotiationLightWeightResponse.fromModel(negotiation));
    }
}
