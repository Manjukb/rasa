import { BotResponse, BotSchemaResponse, RequestUserResponse, SuccessResponse } from '../viewmodels/response';
import { BusinessType, Roles, SessionStatus } from '../enum';
import { ErrorModel, ResponseViewModel } from '../viewmodels/response-viewmodel';

import { Bot, Category, Negotiation, Rfq } from '../database/models';
import { BotRequest } from '../viewmodels/requests';
import { BotResponseTransformer } from '../transformer';
import { Constant } from '../helpers';
import { getRepository } from 'typeorm';
import { injectable, inject } from 'inversify';
import { UserOrganisationServiceContract } from './user-organisation-service';
import { TenantServiceContract } from './tenant-service';
import { CategoryServiceContract } from './category-service';
import { RfqStatus } from '../enum/rfq-status';
import { UserServiceContract } from '.';

export interface BotServiceContract {
    getAll(user: RequestUserResponse): Promise<ResponseViewModel<BotResponse[]>>;
    getById(id: string, organisationId: string): Promise<ResponseViewModel<BotResponse>>;
    getOrganisationBots(
        organisationId: string,
        tenantId?: string,
        skipTenantBots?: boolean,
    ): Promise<ResponseViewModel<BotResponse[]>>;
    create(user: RequestUserResponse, request: BotRequest): Promise<ResponseViewModel<SuccessResponse>>;
    update(user: RequestUserResponse, request: BotRequest): Promise<ResponseViewModel<SuccessResponse>>;
    delete(id: string, user: RequestUserResponse): Promise<ResponseViewModel<SuccessResponse>>;
    schema(): ResponseViewModel<BotSchemaResponse>;
    getOrganisationBot(
        organisationId: string,
        businessType: string,
        tenantId?: string,
        categoryId?: string,
    ): Promise<ResponseViewModel<BotResponse>>;
}
@injectable()
export class BotService implements BotServiceContract {
    public constructor(
        @inject('UserService') private readonly userService: UserServiceContract,
        @inject('UserOrganisationService') private readonly userOrganisationService: UserOrganisationServiceContract,
        @inject('TenantService') private readonly tenantService: TenantServiceContract,
        @inject('CategoryService') private readonly categoryService: CategoryServiceContract,
    ) {}

    private async getBot(
        businessType: string,
        organisationId: string,
        tenantId?: string,
        categoryId?: string,
    ): Promise<Bot> {
        const query = getRepository(Bot)
            .createQueryBuilder('bot')
            .where('bot.organisation_id = :organisationId', { organisationId })
            .andWhere('bot.business_type = :businessType', { businessType });

        if (tenantId) {
            query.andWhere('bot.tenant_id = :tenantId', { tenantId });
        }
        if (categoryId) {
            // stringfy is needed, cref: https://github.com/brianc/node-postgres/issues/442
            query.andWhere(`bot.category_ids @> :categoryId`, {
                categoryId: JSON.stringify([categoryId]),
            });
        }

        const bot = await query.getOne();

        return bot;
    }

    private async storeTenantDefaultBot(
        user: RequestUserResponse,
        request: BotRequest,
    ): Promise<ResponseViewModel<SuccessResponse>> {
        delete request.id;
        const newBot = new Bot();
        newBot.organisation_id = user.organisation_id;
        newBot.business_type = user.business_types[0];
        newBot.tenant_id = user.tenant_id;
        newBot.negotiation_metric = { ...request.parameter, business_type: request.business_type };
        newBot.metric_id = 'default';
        newBot.category_ids = (request.category_ids || []).length ? request.category_ids : [];
        newBot.is_default = (newBot.category_ids || []).length ? 0 : 1;
        await getRepository(Bot).save(newBot);

        return ResponseViewModel.withSuccess();
    }

    private async store(
        user: RequestUserResponse,
        bot: Bot,
        request: BotRequest,
    ): Promise<ResponseViewModel<SuccessResponse>> {
        const isSuperAdmin = user.role === Roles.super_admin;
        bot.organisation_id = user.organisation_id;
        const { business_type: businessType } = request;
        if (isSuperAdmin) {
            bot.organisation_id = request.organisation_id;
        }

        if (user.role === Roles.tenant_admin) {
            const tenantDefaultBot = await getRepository(Bot).findOne({
                where: { tenant_id: user.tenant_id, organisation_id: user.organisation_id, category_ids: '[]' || null },
            });
            // if no default-bot for tenant and edit the bot of organisation
            if (!tenantDefaultBot && bot.id && bot.tenant_id === null) {
                const saveResponse = await this.storeTenantDefaultBot(user, request);
                return saveResponse;
            }
            // if no default-bot for tenant and passing category in request
            if (!tenantDefaultBot && (request.category_ids || []).length) {
                return ResponseViewModel.withError(
                    'Either create new default bot or edit already existed organisation-level default bot before creating bot with category, as provided default-bot is at organisation-level',
                );
            }
        }
        if (businessType === BusinessType.procurement) {
            request.parameter.price.weight =
                1 - (request.parameter.procurement_parameters || []).reduce((acc, curr) => acc + curr.weight, 0);
        }
        bot.negotiation_metric = { ...request.parameter, business_type: request.business_type };
        bot.metric_id = 'default';
        bot.category_ids = (request.category_ids || []).length ? request.category_ids : [];
        bot.is_default = (bot.category_ids || []).length ? 0 : 1;
        request.business_type && (bot.business_type = request.business_type);
        if (user.role !== Roles.tenant_admin) {
            bot.updated_by = user.user_id;
        }
        // if bot is created by tenant_admin, retain the mapping
        bot.tenant_id = bot.tenant_id ? bot.tenant_id : null;
        if (!bot.tenant_id) {
            bot.tenant_id = user.role === Roles.tenant_admin ? user.tenant_id : null;
        }
        await getRepository(Bot).save(bot);

        return ResponseViewModel.withSuccess();
    }

    public async create(user: RequestUserResponse, request: BotRequest): Promise<ResponseViewModel<SuccessResponse>> {
        const response = new ResponseViewModel<SuccessResponse>();
        const businessType = request.business_type;
        const requestCategoryIds = request.category_ids;

        if (!Array.isArray(requestCategoryIds) || !requestCategoryIds.length) {
            // checking for existing default-bot
            const bots = user.tenant_id
                ? await getRepository(Bot).findOne({
                      where: { organisation_id: user.organisation_id, category_ids: '[]', tenant_id: user.tenant_id },
                  })
                : await getRepository(Bot).findOne({
                      where: { organisation_id: user.organisation_id, category_ids: '[]' },
                  });
            const hasBotDefined = bots !== undefined ? true : false;
            if (hasBotDefined) {
                return ResponseViewModel.withError('A default-bot is already defined');
            }
        }

        // checking for existing bots with category
        const bots = await Promise.all(
            (requestCategoryIds || []).map((c) =>
                this.getBot(request.business_type, request.organisation_id, user.tenant_id, c),
            ),
        );
        const hasBotDefined = bots.some((b) => b !== undefined);
        if (hasBotDefined) {
            return ResponseViewModel.withError('A bot is already defined for the selected category');
        }

        if (businessType === BusinessType.procurement) {
            const categories = ResponseViewModel.getData(await this.categoryService.getByIds(request.category_ids), []);
            if (categories.length !== (request.category_ids || []).length) {
                return ResponseViewModel.withError('some categories are not valid');
            }
        }
        const bot = new Bot();
        const res = await this.store(user, bot, request);
        if (ResponseViewModel.hasErrorsStrict(res)) {
            return res;
        }
        response.data = { success: true };

        return response;
    }

    public async update(user: RequestUserResponse, request: BotRequest): Promise<ResponseViewModel<SuccessResponse>> {
        const response = new ResponseViewModel<SuccessResponse>();
        const bot = await getRepository(Bot).findOne(request.id);

        if (!bot || bot.business_type !== request.business_type || bot.organisation_id !== request.organisation_id) {
            response.errors.push(new ErrorModel('Invalid id', 'id'));

            return response;
        }
        if (user.role !== Roles.super_admin && bot.organisation_id !== user.organisation_id) {
            response.errors.push(new ErrorModel(`Request Bot is not doesn't map to your organisation`, 'id'));

            return response;
        }
        // if the categories are same, let it go through
        const difference = (request.category_ids || []).filter((x) => !(bot.category_ids || []).includes(x));
        const sameCategories = difference.length === 0;
        let hasBotDefined = false;
        if (!sameCategories) {
            // check if we already have a bot with the new category
            for (const cId of difference) {
                const data = ResponseViewModel.getData(
                    await this.getOrganisationBot(request.organisation_id, request.business_type, user.tenant_id, cId),
                    null,
                );
                if (data !== null && data.id !== request.id) {
                    hasBotDefined = true;
                    break;
                }
            }
        }
        if (hasBotDefined) {
            response.errors.push(new ErrorModel('A bot is already defined for the category', 'category_id'));

            return response;
        }
        delete request.business_type;
        await this.store(user, bot, request);
        response.data = { success: true };

        return response;
    }

    public async getAll(user: RequestUserResponse): Promise<ResponseViewModel<BotResponse[]>> {
        const response = new ResponseViewModel<BotResponse[]>();
        const isSuperAdmin = user.role === Roles.super_admin;

        if (!isSuperAdmin) {
            const bots = await this.getOrganisationBots(user.organisation_id, user.tenant_id);
            const userIds = bots.data.map((bot) => bot.updated_by);
            const users = await this.userService.getByIds(userIds);
            bots.data.forEach((bot) => {
                if (bot !== undefined && bot.updated_by !== null) {
                    const botUser = users.find((user) => user.user_id === bot.updated_by);
                    bot.updated_by = botUser.name;
                }
            });

            return bots;
        }

        const bots = await getRepository(Bot)
            .createQueryBuilder('bot')
            .innerJoinAndSelect('bot.organisation', 'organisation')
            .orderBy('bot.created_date', 'DESC')
            .getMany();

        response.data = BotResponseTransformer.transformList(bots, []);

        return response;
    }

    public async getOrganisationBots(
        organisationId: string,
        tenantId?: string,
        skipTenantBots?: boolean,
    ): Promise<ResponseViewModel<BotResponse[]>> {
        const response = new ResponseViewModel<BotResponse[]>();

        const organisationResponse = await this.userOrganisationService.getOrganisation({ organisationId });

        if (ResponseViewModel.hasErrors(organisationResponse)) {
            return ResponseViewModel.withErrorModels(organisationResponse.errors);
        }

        let tenantBusinessType = '';

        if (tenantId) {
            const tenantResponse = await this.tenantService.get(tenantId);

            if (ResponseViewModel.hasErrors(tenantResponse)) {
                return ResponseViewModel.withErrorModels(tenantResponse.errors);
            }
            tenantBusinessType = tenantResponse.data.business_type;
            const tenantBots = await getRepository(Bot)
                .createQueryBuilder('bot')
                .where('bot.organisation_id = :organisationId', { organisationId })
                .innerJoinAndSelect('bot.organisation', 'organisation')
                .andWhere('bot.tenant_id = :tenantId', { tenantId })
                .orderBy('bot.is_default', 'DESC') // sort by is_default
                .addOrderBy('bot.updated_date', 'DESC')
                .getMany();
            if (tenantBots.length) {
                // collect unique category ids
                const categoryIds = [
                    ...new Set(
                        tenantBots
                            .filter((b) => b.category_ids)
                            .reduce((prev, curr) => prev.concat(curr.category_ids), []),
                    ),
                ];
                const categories = ResponseViewModel.getData(await this.categoryService.getByIds(categoryIds), []);

                tenantBots.forEach((bot: Bot): void => {
                    bot.organisation = organisationResponse.data;
                });
                response.data = BotResponseTransformer.transformList(tenantBots, categories);

                return response;
            }
        }

        const query = getRepository(Bot)
            .createQueryBuilder('bot')
            .where('bot.organisation_id = :organisationId', { organisationId });
        tenantBusinessType && query.andWhere('bot.business_type = :tenantBusinessType', { tenantBusinessType });
        tenantId && query.andWhere('bot.tenant_id is NULL');
        skipTenantBots && query.andWhere('bot.tenant_id IS NULL');
        query.orderBy('bot.is_default', 'DESC'); // sort by is_default
        const bots = await query.addOrderBy('bot.updated_date', 'DESC').getMany(); // sort by updated_date
        // collect unique category ids
        const categoryIds = [
            ...new Set(bots.filter((b) => b.category_ids).reduce((prev, curr) => prev.concat(curr.category_ids), [])),
        ];
        const categories = ResponseViewModel.getData(await this.categoryService.getByIds(categoryIds), []);

        bots.forEach((bot: Bot): void => {
            bot.organisation = organisationResponse.data;
        });

        response.data = BotResponseTransformer.transformList(bots, categories);

        return response;
    }

    public async getById(id: string, organisationId: string): Promise<ResponseViewModel<BotResponse>> {
        const response = new ResponseViewModel<BotResponse>();
        const bot = await getRepository(Bot)
            .createQueryBuilder('bot')
            .where('bot.id = :id', { id })
            .andWhere('bot.organisation_id = :organisationId', { organisationId })
            .getOne();

        if (!bot) {
            response.errors.push(new ErrorModel('Invalid bot-id passed', 'bot-id'));

            return response;
        }
        const categories = ResponseViewModel.getData(await this.categoryService.getByIds(bot.category_ids), []);
        response.data = BotResponseTransformer.transform(bot, categories);

        return response;
    }

    public async delete(id: string, user: RequestUserResponse): Promise<ResponseViewModel<SuccessResponse>> {
        const bot = (await this.getById(id, user.organisation_id)).data;
        if (!bot) {
            return ResponseViewModel.withError('invalid bot-id');
        }

        if (!bot.categories.length) {
            return ResponseViewModel.withError('A default-bot cannot be deleted');
        }

        const categoryIds = bot.categories.map((e) => e.id);
        const rfqs = await Promise.all(
            categoryIds.map((categoryId) =>
                getRepository(Rfq).find({ where: { category_ids: JSON.stringify([categoryId]) } }),
            ),
        );
        if (user.role == Roles.tenant_admin || user.role === Roles.saas_admin) {
            const rfqIds = rfqs[0].map((r) => r.id);
            const negotiations = await getRepository(Negotiation)
                .createQueryBuilder('nego')
                .where(`nego.rfq_id in (:...ids)`, { ids: rfqIds.length ? rfqIds : [''] })
                .getMany();
            const isActiveNegotiations = negotiations.some(
                (n) => n.status === SessionStatus.init || n.status === SessionStatus.in_progress,
            );
            if (isActiveNegotiations) {
                return ResponseViewModel.withError('A bot has active negotiations');
            }
        } else {
            const isRfqActiveOrCompleted = rfqs[0].some((b) => b.status !== RfqStatus.draft);

            if (isRfqActiveOrCompleted) {
                return ResponseViewModel.withError('A bot has either active or completed RFQs');
            }
        }

        await getRepository(Bot).delete(id);
        return ResponseViewModel.withSuccess(true);
    }

    public schema(): ResponseViewModel<BotSchemaResponse> {
        const response = new ResponseViewModel<BotSchemaResponse>();

        response.data = {
            max_concession_round: { type: Constant.botSchemaFieldsTypes.number, min: 1, max: 16, required: true },
            max_concession_score: { type: Constant.botSchemaFieldsTypes.number, min: 0, max: 1, required: true },
            min_accept_score: { type: Constant.botSchemaFieldsTypes.number, min: 0, max: 1, required: true },
            auto_accept_score: { type: Constant.botSchemaFieldsTypes.number, min: 0, max: 1, required: true },
            concession_pattern: {
                type: Constant.botSchemaFieldsTypes.array,
                required: true,
                items: { type: Constant.botSchemaFieldsTypes.number, min: 0, max: 1, required: true },
            },
            negotiation_round: { type: Constant.botSchemaFieldsTypes.number, min: 1, max: 16, required: true },
            counter_offers: { type: Constant.botSchemaFieldsTypes.number, min: 1, max: 16, default: 4, required: true },
            business_type: {
                type: Constant.botSchemaFieldsTypes.string,
                enum: [BusinessType.collections, BusinessType.procurement, BusinessType.sales],
                required: true,
            },
        };

        return response;
    }

    public async getOrganisationBot(
        organisationId: string,
        businessType: string,
        tenantId?: string,
        categoryId?: string,
    ): Promise<ResponseViewModel<BotResponse>> {
        const response = new ResponseViewModel<BotResponse>();
        if (tenantId) {
            const bot = await this.getBot(businessType, organisationId, tenantId, categoryId);
            if (bot) {
                const categories = ResponseViewModel.getData(await this.categoryService.getByIds(bot.category_ids), []);
                response.data = BotResponseTransformer.transform(bot, categories);

                return response;
            }
        }
        // if bot is not set for categoryId , fallback to get tenant bot
        if (tenantId) {
            const bot = await this.getBot(businessType, organisationId, tenantId);
            if (bot) {
                const categories = ResponseViewModel.getData(await this.categoryService.getByIds(bot.category_ids), []);
                response.data = BotResponseTransformer.transform(bot, categories);

                return response;
            }
        }

        // if bot is not set for tenant, fallback to get organisation bot
        const bot = await this.getBot(businessType, organisationId, null, categoryId);
        if (bot) {
            let categories: Category[] = [];
            if (bot.category_ids && bot.category_ids.length > 0) {
                categories = ResponseViewModel.getData(await this.categoryService.getByIds(bot.category_ids), []);
            }
            response.data = BotResponseTransformer.transform(bot, categories);

            return response;
        }

        // bot is not setup for category fallback to get default bot, a bot without category
        const defaultBot = await this.getBot(businessType, organisationId);
        if (defaultBot) {
            const categories: Category[] = [];
            response.data = BotResponseTransformer.transform(defaultBot, categories);

            return response;
        }

        response.errors.push(new ErrorModel('bot is not setup'));

        return response;
    }
}
