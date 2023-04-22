import { ErrorModel, ResponseViewModel } from '../viewmodels/response-viewmodel';

import { Customer, Negotiation } from '../database/models';
import { ProductResponse, RequestUserResponse, SuccessResponse } from '../viewmodels/response';
import { getRepository } from 'typeorm';
import { injectable, inject } from 'inversify';
import { Request } from 'restify';
import { ChannelFactory, eventSink } from '../factories';
import { NegotiationServiceContract } from './negotiation-session-service';
import { SessionStatus } from '../enum';
import { SessionServiceContract } from './session-service';
import { CustomerServiceContract } from './customer-service';
import {
    OfferParameters,
    SimpleOfferResponse,
    UnAcceptAbleOfferResponse,
} from '../viewmodels/response/negotiation-response';
import { OfferActionResponse } from '../viewmodels/response/negotiation-response';
import { ParameterConfiguration } from '../types/parameter-configuration';
import { TwilioServiceContract } from './twilio-service';
import { Offer } from '../types';
import { BotResultMessage, Constant, Util, env } from '../helpers';
import { BaseWebhooksEvent, WebhooksEventWithOffer, NegotiationRequest } from '../types/webhooks-event';
// import { RfqNegotiationServiceContract } from './rfq-negotiation-service';
import { NegotiationResponse } from '../types/parameter';
import { RfqSalesNegotiationServiceContract } from './rfq-sales-negotiation-service';

type CustomerAndNegotiation = {
    negotiation: Negotiation;
    customer: Customer;
};
export interface ActionServiceContract {
    negotiate(request: Request): Promise<ResponseViewModel<SuccessResponse>>;
    negotiateSalesBot(request: unknown): Promise<ResponseViewModel<NegotiationResponse>>;
    handOverToBot(channelId: string, user: RequestUserResponse): Promise<ResponseViewModel<SuccessResponse>>;
}

@injectable()
export class ActionService implements ActionServiceContract {
    channelService: TwilioServiceContract;
    // @inject('RfqNegotiationService') private readonly rfqNegotiationService: RfqNegotiationServiceContract;
    @inject('RfqSalesNegotiationService')
    private readonly rfqSalesNegotiationService: RfqSalesNegotiationServiceContract;

    public constructor(
        @inject('NegotiationService') private negotiationService: NegotiationServiceContract,
        @inject('CustomerService') private customerService: CustomerServiceContract,
        @inject('SessionService') private sessionService: SessionServiceContract,
    ) {
        this.channelService = ChannelFactory.get();
    }

    private getAnnotationAndObject(attributes: string): { annotationName: string; annotationObject: string } {
        const annotation: string = attributes;
        const splitIndex = annotation.indexOf('{');
        let annotationName = '';
        let annotationObject = '';

        if (splitIndex === -1) {
            annotationName = annotation;
        } else {
            annotationName = annotation.substring(0, splitIndex);
            annotationObject = annotation.substring(splitIndex);
        }

        return { annotationName, annotationObject };
    }

    private getParameterWithUnit(productParameters: ParameterConfiguration[]): { [key: string]: string } {
        const parameterNameAndUnit: { [key: string]: string } = {};
        productParameters.forEach((parameter): void => {
            parameterNameAndUnit[parameter.name] = parameter.unit;
        });

        return parameterNameAndUnit;
    }

    private async getNegotiationAndCustomer(channelSid: string): Promise<ResponseViewModel<CustomerAndNegotiation>> {
        const response = new ResponseViewModel<CustomerAndNegotiation>();
        const negotiationResponse = await this.sessionService.getByChannelId(channelSid);
        if (ResponseViewModel.hasErrors(negotiationResponse)) {
            response.errors = negotiationResponse.errors;

            return response;
        }

        const negotiation = negotiationResponse.data;

        const customerResponse = await this.customerService.getCustomer(negotiation.customer_id);
        if (ResponseViewModel.hasErrors(customerResponse)) {
            response.errors = customerResponse.errors;

            return response;
        }
        response.data = { customer: customerResponse.data, negotiation };

        return response;
    }

    private isAgentSender(clientIdentity: string): boolean {
        return clientIdentity.includes(env.TWILIO_CHANNEL_ADMIN_GUID);
    }

    public async negotiate(request: Request): Promise<ResponseViewModel<SuccessResponse>> {
        console.error('negotiate from twilio received at in service', new Date());

        const response = new ResponseViewModel<SuccessResponse>();
        const { body } = request;

        const channelSid: string | null = (request.body && request.body.ChannelSid) || null;
        const clientIdentity: string = (request.body && request.body.ClientIdentity) || '';
        const isAgentSender = this.isAgentSender(clientIdentity);
        if (!channelSid) {
            response.errors.push(new ErrorModel(`Unable to get channel`, `invalid-channel-id`));

            return response;
        }
        const annotation: string = (body.Attributes && JSON.parse(body.Attributes).annotation) || '';
        const { annotationName, annotationObject } = this.getAnnotationAndObject(annotation);
        const negotiationAndCustomerResponse = await this.getNegotiationAndCustomer(channelSid);
        if (ResponseViewModel.hasErrors(negotiationAndCustomerResponse)) {
            response.errors = negotiationAndCustomerResponse.errors;

            return response;
        }

        const { negotiation } = negotiationAndCustomerResponse.data;

        switch (annotationName) {
            case '/request_nego':
                return await this.customerRequestNego(negotiation);
            case '/userInputMessage':
                return await this.customerChitChat(negotiation, isAgentSender);
            case '/deny':
                return await this.customerDenied(negotiation);
            case '/handover_to_bot':
                return await this.sendLastMessage(negotiation);
            case '/resume':
                return await this.sendLastMessage(negotiation);
            case '/affirm':
                return await this.customerAffirm(negotiation);
            case '/offer':
                const hasCustomerOffer = annotationObject.indexOf('customer_offer');

                if (hasCustomerOffer === -1) {
                    return await this.customerRequestOfferForm(negotiation);
                }
                const customerOfferObject: { [key: string]: string } = JSON.parse(annotationObject).customer_offer;
                return await this.saveCustomerMadeOfferResponse(negotiation, customerOfferObject);
            default:
                return ResponseViewModel.withSuccess();
        }
    }

    public async negotiateSalesBot(body: NegotiationRequest): Promise<ResponseViewModel<NegotiationResponse>> {
        await this.rfqSalesNegotiationService.negotiateSalesBot(
            body.rfqId,
            body.payload,
            body.exitNegotiation,
            body.accept,
            body.user,
        );
        return null;
    }

    private getProductDisplayName(product: ProductResponse): string {
        return Util.getProductDisplayName(product);
    }

    private async saveSendMessage(
        negotiation: Negotiation,
        message: unknown,
        save = true,
    ): Promise<ResponseViewModel<SuccessResponse>> {
        const { channel_id: channelId } = negotiation;
        const sender = this.getBotSender(negotiation.session.product);
        await this.channelService.sendMessage(channelId, sender, message);

        negotiation.last_message = message;
        save && (await getRepository(Negotiation).save(negotiation));

        return ResponseViewModel.withSuccess();
    }

    public async customerRequestNego(negotiation: Negotiation): Promise<ResponseViewModel<SuccessResponse>> {
        const isInitStatus = negotiation.status === SessionStatus.init;

        if (negotiation.status === SessionStatus.customer_accepted) {
            return await this.sendBotWillInformSupervisorMessage(negotiation);
        }
        if (negotiation.status === SessionStatus.customer_rejected) {
            return await this.customerDenied(negotiation);
        }
        if (isInitStatus) {
            const offer = this.negotiationService.returnRound0Offer(negotiation);
            const offerResponse = this.negotiationService.returnFirstOffer(negotiation);
            negotiation.status = SessionStatus.in_progress;
            negotiation.session.offers = [offer];
            this.enquiryStarted(negotiation);
            return await this.saveSendMessage(negotiation, offerResponse);
        }
        const isLastRound = negotiation.session.bot_parameter.max_concession_round === negotiation.round;
        if (!isLastRound) {
            return await this.customerRequestOfferForm(negotiation);
        }

        return await this.sendLastCustomerOfferResponse(negotiation);
    }

    private async customerAffirm(negotiation: Negotiation): Promise<ResponseViewModel<SuccessResponse>> {
        const finalOffer = this.negotiationService.getAffirmOfferResponse(negotiation);
        const productDisplayName = this.getProductDisplayName(negotiation.session.product);
        const thanksMsg: SimpleOfferResponse = {
            type: `simple`,
            text: `Thank you so much for accepting our offer!<br /> The offer details are following as:<br />${productDisplayName}<br />`,
            sub_text: 'I will get my supervisor to review and confirm the deal very soon. Thank you!',
            parameters: finalOffer.parameters,
        };

        await this.saveSendMessage(negotiation, thanksMsg);
        negotiation.status = SessionStatus.customer_accepted;
        await getRepository(Negotiation).save(negotiation);
        this.offerAccepted(negotiation);

        return ResponseViewModel.withSuccess();
    }

    private offerAccepted(negotiation: Negotiation): void {
        const { organisation_id, tenant_id } = negotiation.session.product;
        const data: WebhooksEventWithOffer = {
            offer: negotiation.session.offers[negotiation.session.offers.length - 1].offer,
            productCode: negotiation.product_code,
            organisationId: organisation_id,
            customerId: negotiation.customer_id,
            tenantId: tenant_id,
        };

        eventSink.raiseEvent(Constant.NegotiationEvents.onCustomerAcceptedOffer, data);
    }

    private offerRejected(negotiation: Negotiation): void {
        const { organisation_id, tenant_id } = negotiation.session.product;
        const data: WebhooksEventWithOffer = {
            offer: negotiation.session.offers[negotiation.session.offers.length - 1].offer,
            productCode: negotiation.product_code,
            organisationId: organisation_id,
            customerId: negotiation.customer_id,
            tenantId: tenant_id,
        };

        eventSink.raiseEvent(Constant.NegotiationEvents.onCustomerRejectedOffer, data);
    }

    private enquiryStarted(negotiation: Negotiation): void {
        const { organisation_id, tenant_id } = negotiation.session.product;
        const data: BaseWebhooksEvent = {
            productCode: negotiation.product_code,
            organisationId: organisation_id,
            customerId: negotiation.customer_id,
            tenantId: tenant_id,
        };

        eventSink.raiseEvent(Constant.NegotiationEvents.onCustomerStartedEnquiry, data);
    }

    private async sendLastMessage(negotiation: Negotiation): Promise<ResponseViewModel<SuccessResponse>> {
        if (!negotiation.last_message) {
            return ResponseViewModel.withSuccess();
        }
        const lastMessage = negotiation.last_message;
        return await this.saveSendMessage(negotiation, lastMessage, false);
    }

    private async customerChitChat(
        negotiation: Negotiation,
        isAgentSender: boolean,
    ): Promise<ResponseViewModel<SuccessResponse>> {
        if (isAgentSender) {
            negotiation.has_unread_messages = false;
            await getRepository(Negotiation).save(negotiation);

            return ResponseViewModel.withSuccess();
        }
        const msg: OfferActionResponse = {
            type: 'action',
            text: 'Thanks for your inputs. We will get back to you soon!<br /> Can we resume negotiation?',
            actions: Util.resumeOptions(),
            parameters: [],
        };
        negotiation.has_unread_messages = true;
        await getRepository(Negotiation).save(negotiation);

        return await this.saveSendMessage(negotiation, msg, false);
    }

    private async customerDenied(negotiation: Negotiation): Promise<ResponseViewModel<SuccessResponse>> {
        const deniedMsg: SimpleOfferResponse = {
            type: `simple`,
            text: `Sorry we couldn’t arrive at a deal today. Hope to do business with you sometime in the future.`,
        };
        negotiation.status = SessionStatus.customer_rejected;
        await this.saveSendMessage(negotiation, deniedMsg);
        this.offerRejected(negotiation);

        return ResponseViewModel.withSuccess();
    }

    private async sendBotDefaultMessageWhileBotDisabled(
        negotiation: Negotiation,
    ): Promise<ResponseViewModel<SuccessResponse>> {
        const msg: SimpleOfferResponse = {
            type: `simple`,
            text: `Thanks for your inputs. Please wait for my supervisor to review your inputs.`,
        };
        await this.saveSendMessage(negotiation, msg, false);

        return ResponseViewModel.withSuccess();
    }

    private async customerRequestOfferForm(negotiation: Negotiation): Promise<ResponseViewModel<SuccessResponse>> {
        const isBotActive = negotiation.is_bot_active;
        if (!isBotActive) {
            return await this.sendBotDefaultMessageWhileBotDisabled(negotiation);
        }
        const offerForm = this.negotiationService.returnOfferForm(negotiation);

        return await this.saveSendMessage(negotiation, offerForm);
    }

    private async saveOfferAndMessage(
        negotiation: Negotiation,
        customerOfferObject: { [key: string]: string },
    ): Promise<ResponseViewModel<SuccessResponse>> {
        const offerScore: { [key: string]: string } = {};
        Object.keys(customerOfferObject).forEach((key: string): void => {
            offerScore[key] = '0';
        });

        const offer: Offer = {
            by: Constant.offerBy.user,
            offer: customerOfferObject,
            offer_score: offerScore,
            utility_score: '0',
            round: negotiation.round + 1,
            message: '',
        };
        negotiation.round++;
        negotiation.session.offers.push(offer);
        await getRepository(Negotiation).save(negotiation);
        await this.sendBotDefaultMessageWhileBotDisabled(negotiation);

        return ResponseViewModel.withSuccess();
    }

    public async saveCustomerMadeOfferResponse(
        negotiation: Negotiation,
        customerOfferObject: { [key: string]: string },
    ): Promise<ResponseViewModel<SuccessResponse>> {
        const isBotActive = negotiation.is_bot_active;
        if (!isBotActive) {
            return this.saveOfferAndMessage(negotiation, customerOfferObject);
        }
        const customerOfferResultResponse = this.negotiationService.calculate(negotiation, customerOfferObject);
        if (ResponseViewModel.hasErrors(customerOfferResultResponse)) {
            if (!negotiation.round) {
                const offer = this.negotiationService.returnFirstOffer(negotiation);
                return await this.saveSendMessage(negotiation, offer);
            }
            const botOfferResult = negotiation.session.offers.find(
                (offer): boolean =>
                    (offer.by === Constant.offerBy.bot || offer.by === Constant.offerBy.agent) &&
                    offer.round === negotiation.round,
            );
            const unAcceptAbleOfferResponse = this.getUnAcceptAbleOfferResponse(negotiation, botOfferResult);
            const { text } = unAcceptAbleOfferResponse;
            const actionOfferResponse = this.getBotOfferActionResponse(negotiation, botOfferResult, false, text);
            await this.saveSendMessage(negotiation, actionOfferResponse);

            return ResponseViewModel.withSuccess();
        }

        let botOfferResult = customerOfferResultResponse.data.bot;
        const customerOfferResult = customerOfferResultResponse.data.customer;
        const rounds = negotiation.session.bot_parameter.max_concession_round;
        const maxConcessionScore = negotiation.session.bot_parameter.max_concession_score;
        const isLastRound = customerOfferResult.round === rounds;
        const shouldAccept =
            customerOfferResult.utility_score >= botOfferResult.utility_score ||
            (isLastRound && +customerOfferResult.utility_score >= maxConcessionScore);

        if (shouldAccept) {
            botOfferResult = { ...customerOfferResult };
            botOfferResult.by = Constant.offerBy.bot;
        }

        negotiation.session.offers.push(customerOfferResult, botOfferResult);
        negotiation.status = SessionStatus.in_progress;
        negotiation.round++;
        if (!shouldAccept) {
            const unAcceptAbleOfferResponse = this.getUnAcceptAbleOfferResponse(negotiation, botOfferResult);
            const { text } = unAcceptAbleOfferResponse;
            const actionOfferResponse = this.getBotOfferActionResponse(negotiation, botOfferResult, isLastRound, text);
            await this.saveSendMessage(negotiation, actionOfferResponse);

            return ResponseViewModel.withSuccess();
        }

        const thanksMsg = this.getBotAcceptedCustomerOfferResponseNew(negotiation, customerOfferResult);
        await this.saveSendMessage(negotiation, thanksMsg);

        return ResponseViewModel.withSuccess();
    }

    private getUnAcceptAbleOfferResponse(negotiation: Negotiation, botOffer: Offer): UnAcceptAbleOfferResponse {
        const text = BotResultMessage.getBotResultMessage(
            negotiation.round,
            negotiation.session.bot_parameter.max_concession_round,
        );
        const unAcceptAbleOfferResponse = new UnAcceptAbleOfferResponse();
        unAcceptAbleOfferResponse.type = 'simple';
        unAcceptAbleOfferResponse.text = text;
        unAcceptAbleOfferResponse.product_name = this.getProductDisplayName(negotiation.session.product);
        unAcceptAbleOfferResponse.values = {};
        unAcceptAbleOfferResponse.values2 = [];
        const parameterNameAndUnit = this.getParameterWithUnit(negotiation.session.product_parameters);
        Object.keys(botOffer.offer).forEach((key: string): void => {
            const unit = parameterNameAndUnit[key];
            unAcceptAbleOfferResponse.values[key] = `${botOffer.offer[key]} ${unit}`;
            unAcceptAbleOfferResponse.values2.push({
                name: key,
                unit,
                value: botOffer.offer[key],
                display_name: Util.getParameterDisplayName(key),
                quantity_unit:
                    key === Constant.productParameters.price ? Util.getQuantityUnit(parameterNameAndUnit) : null,
            });
        });

        return unAcceptAbleOfferResponse;
    }

    private getBotOfferActionResponse(
        negotiation: Negotiation,
        botOffer: Offer,
        isLastRound: boolean,
        text?: string,
    ): OfferActionResponse {
        const response = new OfferActionResponse();
        response.type = 'action';
        text && (response.text = text);
        response.actions = Util.actionOptions(isLastRound);
        response.parameters = [];
        const parameterNameAndUnit = this.getParameterWithUnit(negotiation.session.product_parameters);

        response.parameters = Object.keys(botOffer.offer).map(
            (key: string): OfferParameters => {
                const unit = parameterNameAndUnit[key];
                return {
                    name: key,
                    unit: unit,
                    value: botOffer.offer[key],
                    display_name: Util.getParameterDisplayName(key),
                    quantity_unit:
                        key === Constant.productParameters.price ? Util.getQuantityUnit(parameterNameAndUnit) : null,
                };
            },
        );
        isLastRound && (response.sub_text = 'Please confirm offer');

        return response;
    }

    private getBotAcceptedCustomerOfferResponseNew(
        negotiation: Negotiation,
        customerOffer: Offer,
    ): OfferActionResponse {
        const parameterNameAndUnit = this.getParameterWithUnit(negotiation.session.product_parameters);
        const productDisplayName = this.getProductDisplayName(negotiation.session.product);
        return {
            text: `Thanks a lot! We have a deal....Please confirm the offer for ${productDisplayName}`,
            type: 'action',
            actions: Util.actionOptions(true),
            parameters: Object.keys(customerOffer.offer).map(
                (key): OfferParameters => {
                    return {
                        name: key,
                        value: customerOffer.offer[key],
                        unit: parameterNameAndUnit[key],
                        display_name: Util.getParameterDisplayName(key),
                        quantity_unit:
                            key === Constant.productParameters.price
                                ? Util.getQuantityUnit(parameterNameAndUnit)
                                : null,
                    };
                },
            ),
        };
    }

    private getBotWillInformSupervisorResponse(): SimpleOfferResponse {
        return {
            type: `simple`,
            text: `Please wait for my supervisor to review and confirm the deal.`,
        };
    }

    private async sendBotWillInformSupervisorMessage(
        negotiation: Negotiation,
    ): Promise<ResponseViewModel<SuccessResponse>> {
        const botResponse = this.getBotWillInformSupervisorResponse();
        await this.saveSendMessage(negotiation, botResponse);

        return ResponseViewModel.withSuccess();
    }

    private getBotWishingToAcceptOfferResponse(): SimpleOfferResponse {
        return {
            type: `action`,
            text: `Please confirm your order.`,
            parameters: [],
            actions: Util.actionOptions(true),
        };
    }

    private async sendLastCustomerOfferResponse(negotiation: Negotiation): Promise<ResponseViewModel<SuccessResponse>> {
        const round = negotiation.round;
        const isLastRound = round === negotiation.session.bot_parameter.max_concession_round;
        const maxConcessionScore = negotiation.session.bot_parameter.max_concession_score;
        if (!isLastRound) {
            return this.customerRequestOfferForm(negotiation);
        }
        const lastCustomerOffer = negotiation.session.offers.find((offer: Offer): boolean => {
            return offer.round === round && offer.by === Constant.offerBy.user;
        });
        const lastBotOffer = negotiation.session.offers.find((offer: Offer): boolean => {
            return offer.round === round && (offer.by === Constant.offerBy.agent || offer.by === Constant.offerBy.bot);
        });
        if (lastCustomerOffer) {
            const shouldAccept = +lastCustomerOffer.utility_score >= maxConcessionScore;
            if (!shouldAccept) {
                const actionOfferResponse = this.getBotOfferActionResponse(negotiation, lastBotOffer, isLastRound);
                return await this.saveSendMessage(negotiation, actionOfferResponse);
            }
            const botResponse = this.getBotWishingToAcceptOfferResponse();

            return await this.saveSendMessage(negotiation, botResponse);
        }

        return ResponseViewModel.withSuccess();
    }

    private getBotSender(product: ProductResponse): string {
        const tenantIdOrOrgId = product.tenant_id ? product.tenant_id : product.organisation_id;

        return `${Constant.offerBy.bot}-${tenantIdOrOrgId}`;
    }

    public async handOverToBot(
        channelId: string,
        user: RequestUserResponse,
    ): Promise<ResponseViewModel<SuccessResponse>> {
        const negotiation = await getRepository(Negotiation).findOne({
            where: { channel_id: channelId },
            order: { created_date: 'DESC' },
        });
        if (!negotiation) {
            return ResponseViewModel.withErrorModels([new ErrorModel('in-valid session id', 'session_id')]);
        }
        const { product } = negotiation.session;
        const productTenantOrOrgId = product.tenant_id ? product.tenant_id : product.organisation_id;
        const userTenantIdOrOrgId = user.tenant_id ? user.tenant_id : user.organisation_id;

        if (productTenantOrOrgId !== userTenantIdOrOrgId) {
            return ResponseViewModel.withErrorModels([
                new ErrorModel('you are not an authorized person', 'session_id'),
            ]);
        }
        return this.sendLastMessage(negotiation);
    }
}
