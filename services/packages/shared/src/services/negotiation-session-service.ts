import { Negotiation, NegotiationSession } from '../database/models';
import { ErrorModel, ResponseViewModel } from '../viewmodels/response-viewmodel';
import { SessionStatus } from '../enum';
import { ProductResponse, RequestUserResponse, SuccessResponse } from '../viewmodels/response';
import { getRepository, SelectQueryBuilder } from 'typeorm';
import { injectable, inject } from 'inversify';
import { SettingServiceContract } from './setting-service';
import { getConnection } from 'typeorm';
import { SearchRequest } from '../viewmodels/requests';
import { RoleService } from './role-service';
import {
    AffirmOfferParameters,
    OfferActionResponse,
    OfferFormResponse,
    OfferParameters,
} from '../viewmodels/response/negotiation-response';

import { ParameterConfiguration } from '../types/parameter-configuration';
import { Offer, Parameter, ProductParameter } from '../types';
import { Constant, Util } from '../helpers';
import { NegotiationCalculateResponse } from '../types/negotiation-session';
export interface NegotiationServiceContract {
    markAsAbandoned(): Promise<ResponseViewModel<SuccessResponse>>;
    getSessions(
        user: RequestUserResponse,
        searchRequest: SearchRequest,
    ): Promise<ResponseViewModel<NegotiationSession[]>>;
    returnFirstOffer(negotiation: Negotiation): OfferActionResponse;
    returnOfferForm(negotiation: Negotiation): OfferFormResponse;
    getAffirmOfferResponse(negotiation: Negotiation): AffirmOfferParameters;
    calculate(
        negotiation: Negotiation,
        customerOffer: { [key: string]: string },
    ): ResponseViewModel<NegotiationCalculateResponse>;
    returnRound0Offer(negotiation: Negotiation): Offer;
}
@injectable()
export class NegotiationService implements NegotiationServiceContract {
    public constructor(@inject('SettingService') private readonly settingService: SettingServiceContract) {}

    public async markAsAbandoned(): Promise<ResponseViewModel<SuccessResponse>> {
        const response = new ResponseViewModel<SuccessResponse>();

        const result = await getRepository(NegotiationSession)
            .createQueryBuilder('session')
            .select(['session.organisation_id'])
            .where('session.session_status IN (:...status)', {
                status: [SessionStatus.customer_negotiate],
            })
            .groupBy('session.organisation_id, session.id')
            .getMany();

        const organisationIds = [...new Set(result.map((row) => row.organisation_id))];

        organisationIds.forEach(
            async (organisationId: string): Promise<void> => {
                const clientSetting = await this.settingService.getById(organisationId);
                const sessionTimeOut =
                    clientSetting && clientSetting.settings
                        ? Number(JSON.parse(JSON.stringify(clientSetting.settings)).session_time_out)
                        : 7;

                const connection = getConnection();
                const queryRunner = connection.createQueryRunner();

                await queryRunner.query(
                    `UPDATE "product_negotiation_session" set 
                        session_status = '${SessionStatus.abandoned}',
                        updated_date = now()
                     where organisation_id = '${organisationId}' and session_status = '${SessionStatus.customer_negotiate}' and DATE(NOW()) - DATE(updated_date) >= ${sessionTimeOut}`,
                );

                return;
            },
        );

        response.data = { success: true };

        return response;
    }

    private addSearchAndFilters<T>(
        queryBuilder: SelectQueryBuilder<T>,
        searchRequest: SearchRequest,
    ): SelectQueryBuilder<T> {
        const organisationId = searchRequest.organisation_id || null;
        const customerEmail = searchRequest.customer_email || null;
        const productId = searchRequest.product_id || null;
        const sessionStatus = searchRequest.session_status || null;
        const createdDate = searchRequest.created_date || null;
        const updatedDate = searchRequest.updated_date || null;

        if (organisationId) {
            queryBuilder.andWhere('session.organisation = :organisationId', { organisationId });
        }

        if (customerEmail) {
            queryBuilder.andWhere('session.customer_email = :customerEmail', { customerEmail });
        }

        if (productId) {
            queryBuilder.andWhere('session.product_id = :productId', { productId });
        }

        if (sessionStatus) {
            if (sessionStatus === SessionStatus.open) {
                queryBuilder.andWhere('session.session_status = :openStatus', {
                    openStatus: SessionStatus.customer_negotiate,
                });
            } else if (sessionStatus === SessionStatus.closed) {
                queryBuilder.where('session.session_status NOT IN (:...status)', {
                    status: [SessionStatus.customer_negotiate, SessionStatus.agent_fix_offer],
                });
            } else {
                queryBuilder.andWhere('session.session_status = :sessionStatus', {
                    sessionStatus,
                });
            }
        }

        if (createdDate && updatedDate) {
            queryBuilder.andWhere(
                'date(session.created_date) >= date(:createdDate) and date(session.created_date) <= date(:updatedDate)',
                { createdDate, updatedDate },
            );
        }

        if (createdDate && updatedDate === null) {
            queryBuilder.andWhere('date(session.created_date) >= date(:createdDate)', {
                createdDate,
            });
        }

        if (updatedDate && createdDate === null) {
            queryBuilder.andWhere('date(session.created_date) <= date(:updatedDate)', { updatedDate });
        }

        return queryBuilder;
    }

    public async getSessions(
        user: RequestUserResponse,
        searchRequest: SearchRequest,
    ): Promise<ResponseViewModel<NegotiationSession[]>> {
        const response = new ResponseViewModel<NegotiationSession[]>();
        const isSuperAdmin = new RoleService().isSuperAdmin(user);
        if (!isSuperAdmin) {
            searchRequest.organisation_id = user.organisation_id;
        }

        const queryBuilder = getRepository(NegotiationSession)
            .createQueryBuilder('session')
            .orderBy('session.created_date', 'DESC');

        this.addSearchAndFilters<NegotiationSession>(queryBuilder, searchRequest);

        const result = await queryBuilder.getMany();
        response.data = result;

        return response;
    }

    private validateCustomerOfferValues(
        productParameters: ProductParameter[],
        customerOffer: { [key: string]: string },
        lastHumanOffer?: Offer,
    ): ResponseViewModel<SuccessResponse> {
        const response = new ResponseViewModel<SuccessResponse>();
        // if customer offer value is less or greater then parameter min, mac ,then invalidate the request
        productParameters.forEach((productParameter: ProductParameter): void => {
            const { name, max, min } = productParameter;
            // parameter is price, skip min, max value check
            if (Constant.productParameters.price === productParameter.name) {
                return;
            }
            const isValid = +customerOffer[name] >= min && +customerOffer[name] <= max;
            if (!isValid) {
                response.errors.push(new ErrorModel(`'${name}' must be in range of ${min} & ${max}`, name));
            }
        });

        if (ResponseViewModel.hasErrorsStrict(response)) {
            return response;
        }

        // to check is customer last offer is same as current offer
        if (lastHumanOffer) {
            const keys = Object.keys(lastHumanOffer.offer);

            const isSameAsPrevious = keys.every(
                (key: string): boolean => +lastHumanOffer.offer[key] === +customerOffer[key],
            );
            if (isSameAsPrevious) {
                response.errors.push(new ErrorModel('Current offer is same as pervious value', 'duplicate'));

                return response;
            }

            const isAllValuesLessThanPreviousOffer = keys.every(
                (key: string): boolean => +customerOffer[key] < +lastHumanOffer.offer[key],
            );
            if (isAllValuesLessThanPreviousOffer) {
                response.errors.push(new ErrorModel(`Current offer can't be less than previous offer`, 'duplicate'));

                return response;
            }
        }

        return ResponseViewModel.withSuccess();
    }

    public calculate(
        negotiation: Negotiation,
        customerOffer: { [key: string]: string },
    ): ResponseViewModel<NegotiationCalculateResponse> {
        const response = new ResponseViewModel<NegotiationCalculateResponse>();
        const round = negotiation.round;
        const botParameter = negotiation.session.bot_parameter;
        const productParameters = negotiation.session.product_parameters;
        const sessions: Offer[] = negotiation.session.offers || [];

        const botAutoAcceptScore = botParameter.auto_accept_score;

        const lastBotOffer: Offer | undefined = sessions.find(
            (session: Offer) => session.by === Constant.offerBy.bot && session.round === round,
        );

        const lastHumanOffer: Offer | undefined = sessions.find(
            (session: Offer) => session.by === Constant.offerBy.user && session.round === round,
        );

        const validationResponse = this.validateCustomerOfferValues(productParameters, customerOffer, lastHumanOffer);

        if (ResponseViewModel.hasErrorsStrict(validationResponse)) {
            response.errors = validationResponse.errors;

            return response;
        }

        let customerOfferTotalScore = 0;
        let botOfferTotalScore = 0;

        const customerResult: Offer = new Offer();
        const botResult: Offer = new Offer();
        customerResult.by = Constant.offerBy.user;
        customerResult.offer = {};
        customerResult.offer_score = {};

        botResult.by = Constant.offerBy.bot;
        botResult.offer = {};
        botResult.offer_score = {};

        productParameters.forEach((productParameter: ParameterConfiguration): void => {
            const { name, weight } = productParameter;
            const userInput = customerOffer[name];
            const customerOfferScore = this.getOfferScore(userInput, productParameter);

            customerResult.offer[name] = userInput;
            customerResult.offer_score[name] = customerOfferScore;
            customerOfferTotalScore += +customerOfferScore * weight || 0;
        });

        customerResult.utility_score = this.transformToFixedNumber(customerOfferTotalScore);

        productParameters.forEach((productParameter: ProductParameter): void => {
            const { name } = productParameter;
            const userInput = customerResult.offer[name] || 0;
            const lastOffer = (lastBotOffer && lastBotOffer.offer[productParameter.name]) || 0;

            if (+customerResult.utility_score >= botAutoAcceptScore) {
                botResult.offer[name] = `${userInput}`;
                botResult.offer_score[name] = customerResult.offer_score[name];
                botOfferTotalScore += +botResult.offer_score[name] * productParameter.weight || 0;

                return;
            }
            // calculating counter offer
            botResult.offer[name] = this.getOffer(productParameter, +userInput, botParameter, round, +lastOffer);
            botResult.offer_score[name] = this.getOfferScore(+botResult.offer[name], productParameter);

            botOfferTotalScore += +botResult.offer_score[name] * productParameter.weight || 0;

            return;
        });
        customerResult.round = round + 1;
        botResult.round = round + 1;
        botResult.utility_score = this.transformToFixedNumber(botOfferTotalScore);

        response.data = { bot: botResult, customer: customerResult };
        return response;
    }

    private transformToFixedNumber(value: number | string, fixedTo = 2): string {
        if (typeof value === 'string') {
            const num = parseFloat(value);
            const result = num.toFixed(fixedTo);

            return result;
        }
        if (value) {
            const result = value.toFixed(fixedTo);

            return result;
        }
        return `0`;
    }

    private getOffer(
        productParameter: ParameterConfiguration,
        userInput: number,
        botParameter: Parameter,
        round: number,
        lasOffer: number,
    ): string {
        const { inverse, step } = productParameter;
        let { min, max } = productParameter;
        const userInputWithAtLeastMin = userInput > min ? userInput : min;
        if (+inverse) {
            min = lasOffer ? lasOffer : min;
            if (typeof step === 'object') {
                const steps = step;
                let value = min - (min - userInput) * botParameter.concession_pattern[round];
                value = userInput < value ? userInput : value;
                const roundValue = Util.closestNumberFromArray(value, steps, productParameter.max, min, inverse);

                return this.transformToFixedNumber(roundValue);
            }

            let value = min - (min - userInput) * botParameter.concession_pattern[round];
            value = userInput < value ? userInput : value;
            const roundValue = Util.closestNumber(value, +step, productParameter.max, min);

            return this.transformToFixedNumber(roundValue);
        }
        max = lasOffer ? lasOffer : max;
        let value = max - (max - userInputWithAtLeastMin) * botParameter.concession_pattern[round];
        value = userInputWithAtLeastMin > value ? userInputWithAtLeastMin : value;
        const roundValue = Util.closestNumber(value, +step, productParameter.max, min);

        return this.transformToFixedNumber(roundValue);
    }

    private getOfferScore(userInput: string | number, productParameter: ProductParameter): string {
        if (+productParameter.inverse) {
            const value = (productParameter.max - +userInput) / (productParameter.max - productParameter.min);
            return this.transformToFixedNumber(value);
        }
        const value = (+userInput - productParameter.min) / (productParameter.max - productParameter.min);
        const score = this.transformToFixedNumber(value);

        return score;
    }

    public getAffirmOfferResponse(negotiation: Negotiation): AffirmOfferParameters {
        const round = negotiation.round;
        const response = new AffirmOfferParameters();
        const lasOffer = negotiation.session.offers.find((offer: Offer): boolean => {
            return offer.round === round && (offer.by === Constant.offerBy.bot || offer.by === Constant.offerBy.agent);
        });
        response.parameters = [];
        const productParameters = negotiation.session.product_parameters;
        const parameterNameAndUnit = Util.getParameterWithUnit(productParameters);

        productParameters.forEach((productParameter: ParameterConfiguration): void => {
            const max = lasOffer ? lasOffer.offer[productParameter.name] : productParameter.max;
            const { name, unit } = productParameter;
            response.parameters.push({
                name,
                unit,
                value: max,
                display_name: Util.getParameterDisplayName(name),
                quantity_unit:
                    name === Constant.productParameters.price ? Util.getQuantityUnit(parameterNameAndUnit) : null,
            });
        });

        return response;
    }

    public returnOfferForm(negotiation: Negotiation): OfferFormResponse {
        const round = negotiation.round;
        const response = new OfferFormResponse();
        response.type = 'form';
        response.text = this.getProductDisplayName(negotiation.session.product);
        response.product_name = this.getProductDisplayName(negotiation.session.product);
        response.actions = Util.actionOptions(false, true);
        response.parameter = [];
        const lasOffer = negotiation.session.offers.find((offer: Offer): boolean => {
            return offer.round === round && offer.by === Constant.offerBy.bot;
        });
        const productParameters = negotiation.session.product_parameters;
        const parameterNameAndUnit = Util.getParameterWithUnit(productParameters);

        productParameters.forEach((productParameter: ParameterConfiguration): void => {
            const from = lasOffer ? lasOffer.offer[productParameter.name] : productParameter.max;
            const { name, step, unit } = productParameter;
            response.parameter.push({
                id: `customer_offer.${name}`,
                label: name,
                display_name: Util.getParameterDisplayName(name),
                type: name === Constant.paymentTermsField ? 'SelectBox' : 'InputNumber',
                unit: unit,
                quantity_unit:
                    name === Constant.productParameters.price ? Util.getQuantityUnit(parameterNameAndUnit) : null,
                step: step,
                inputProps: {
                    step: step,
                    initialValue: from,
                    defaultValue: from,
                },
                validators: [
                    {
                        type: 'number',
                        required: true,
                        message: `Please input a number of ${Util.capitalize(
                            productParameter.name,
                        )} (${productParameter.unit.toUpperCase()})`,
                    },
                    {
                        type: 'greater_than',
                        greaterThan: 0,
                    },
                    {
                        type: 'range',
                        min: productParameter.name === 'price' ? 0 : productParameter.min,
                        max: productParameter.max,
                    },
                    {
                        type: 'step',
                        step: +productParameter.step,
                        from: from,
                    },
                ],
            });
        });

        return response;
    }

    private getProductDisplayName(product: ProductResponse): string {
        return Util.getProductDisplayName(product);
    }

    public returnRound0Offer(negotiation: Negotiation): Offer {
        const offer = new Offer();
        const { product_parameters: parameters } = negotiation.session;
        offer.by = Constant.offerBy.bot;
        offer.round = 0;
        offer.offer = {};
        offer.offer_score = {};
        let utilityScore = 0;
        const totalWight = parameters.map((parameter) => +parameter.weight).reduce((a, b) => a + b);
        parameters.forEach((parameter: ParameterConfiguration): void => {
            const value = +parameter.inverse ? parameter.min : parameter.max;
            const offerScore = this.transformToFixedNumber(this.getOfferScore(value, parameter), 2);
            offer.offer[parameter.name] = this.transformToFixedNumber(value, 2);
            offer.offer_score[parameter.name] = offerScore;
            utilityScore += (+offerScore * +parameter.weight) / totalWight;
        });
        offer.utility_score = `${utilityScore}`;

        return offer;
    }

    public returnFirstOffer(negotiation: Negotiation): OfferActionResponse {
        const response = new OfferActionResponse();
        const { product, product_parameters } = negotiation.session;
        response.type = 'action';
        response.text = `Thanks for expressing your interest in buying ${this.getProductDisplayName(
            product,
        )}.<br /> We would like you to consider this offer:`;
        response.sub_text = 'Please let us know what you think';

        const parameterNameAndUnit = Util.getParameterWithUnit(product_parameters);

        response.parameters = product_parameters.map(
            (parameter: ParameterConfiguration): OfferParameters => {
                const value = +parameter.inverse ? parameter.min : parameter.max;
                const { name, unit } = parameter;
                return {
                    name: name,
                    unit: unit,
                    value: this.transformToFixedNumber(value, 2),
                    display_name: Util.getParameterDisplayName(parameter.name),
                    quantity_unit:
                        name === Constant.productParameters.price ? Util.getQuantityUnit(parameterNameAndUnit) : null,
                };
            },
        );
        response.actions = Util.actionOptions();

        return response;
    }
}
