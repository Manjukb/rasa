import { RequestUserResponse, SuccessResponse, RfqResponse, PaginatedResponseModel } from '../viewmodels/response';

import { ResponseViewModel } from '../viewmodels/response-viewmodel';
import { Rfq } from '../database/models';
import { RfqRequest, RfqSearchRequest } from '../viewmodels/requests';
import { getRepository, getConnection } from 'typeorm';
import { injectable, inject } from 'inversify';
import { RfqSupplierServiceContract } from './rfq-supplier-service';
import { RfqItemServiceContract } from './rfq-item-service';
import { ProductServiceContract } from './product-service';
import { SupplierServiceContract } from './supplier-service';
import { UserServiceContract } from './user-service';
import { CategoryServiceContract } from './category-service';
import { SupplierUserServiceContract } from '.';
import { Constant, Roles, Util } from '..';
import { RfqStatus } from '../enum/rfq-status';
import { RfqNotificationServiceContract } from './rfq-notification-service';
import { TemplateType } from '../enum/template-type';

export interface RfqServiceContract {
    create(request: RfqRequest, user: RequestUserResponse): Promise<ResponseViewModel<RfqResponse>>;
    update(request: RfqRequest, user: RequestUserResponse): Promise<ResponseViewModel<RfqResponse>>;
    getAll(
        user: RequestUserResponse,
        searchRequest: RfqSearchRequest,
    ): Promise<ResponseViewModel<PaginatedResponseModel<RfqResponse>>>;
    getById(id: string, user?: RequestUserResponse): Promise<ResponseViewModel<RfqResponse>>;
    getById(id: string, user: RequestUserResponse): Promise<ResponseViewModel<RfqResponse>>;
    delete(id: string, user: RequestUserResponse): Promise<ResponseViewModel<SuccessResponse>>;
    getByIds(ids: string[]): Promise<ResponseViewModel<Rfq[]>>;
    updateRfqStatus(id: string, status: RfqStatus): Promise<void>;
}

@injectable()
export class RfqService implements RfqServiceContract {
    public constructor(
        @inject('RfqSupplierService') private readonly rfqSupplierService: RfqSupplierServiceContract,
        @inject('RfqItemService') private readonly rfqItemService: RfqItemServiceContract,
        @inject('ProductService') private readonly productService: ProductServiceContract,
        @inject('UserService') private readonly userService: UserServiceContract,
        @inject('SupplierService') private readonly supplierService: SupplierServiceContract,
        @inject('SupplierUserService') private readonly supplierUserService: SupplierUserServiceContract,
        @inject('CategoryService') private readonly categoryService: CategoryServiceContract,
        @inject('RfqNotificationService') private readonly rfqNotificationService: RfqNotificationServiceContract,
    ) {}

    private async store(request: RfqRequest, user: RequestUserResponse): Promise<ResponseViewModel<Rfq>> {
        const userId = user.user_id;

        // validate product Ids
        const productIds = request.items ? request.items.map((i) => i.product_id) : [];
        const uniqueProductIds = [...new Set(productIds)];
        const dbProducts = await this.productService.getMany(uniqueProductIds, user.organisation_id);
        if (uniqueProductIds.length !== dbProducts.data.length) {
            return ResponseViewModel.withError('some invalid product passed');
        }

        const { data: products } = dbProducts;
        // set the currency of the product
        (request.items || []).forEach((item) => {
            item.currency = (products.find((p) => p.id === item.product_id) || {}).currency;
        });
        if (request.parameter && request.parameter.price) {
            request.parameter.price.weight =
                1 - request.parameter.procurement_parameters.reduce((acc, curr) => acc + curr.weight, 0);
        }
        const rfq = RfqRequest.toRFQModel(request, userId, user.organisation_id);
        const connection = getConnection();
        const queryRunner = connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        console.info('update-rfq:: started transaction', rfq);
        try {
            // save rfq
            if (!request.id) {
                // await getRepository(Rfq).save(rfq);
                await queryRunner.manager.save(rfq);
            } else {
                console.info('update-rfq:: inside !isCreate block');
                await queryRunner.manager.update(Rfq, { id: rfq.id }, rfq);
            }
            console.info('update-rfq:: saved rfq');
            // save rfq supplier
            const saveRfqItems = productIds.length > 0;
            if (saveRfqItems) {
                console.info('update-rfq:: saving rfq items');
                await this.rfqItemService.create(queryRunner, request.items, rfq.id, userId);
            }
            console.info('update-rfq:: saved rfq items');
            const saveRfqSuppliers = request.suppliers && request.suppliers.length > 0;
            // save rfq items
            if (saveRfqSuppliers) {
                console.info('update-rfq:: saving suppliers');
                await this.rfqSupplierService.create(queryRunner, request.suppliers, rfq.id);
            }
            console.info('update-rfq::commiting transaction', rfq);
            await queryRunner.commitTransaction();
        } catch (err) {
            console.info('update-rfq:: in error block and rolling back transaction', rfq);
            await queryRunner.rollbackTransaction();
            console.info('update-rfq:: in error block and rolled back transaction');
            if (err instanceof Error) {
                throw err;
            }
            throw new Error(err);
        } finally {
            await queryRunner.release();
        }
        return ResponseViewModel.with(rfq);
    }

    public async create(request: RfqRequest, user: RequestUserResponse): Promise<ResponseViewModel<RfqResponse>> {
        const rfqResponse = await this.store(request, user);
        if (ResponseViewModel.hasErrors(rfqResponse)) {
            return ResponseViewModel.withErrorModels(rfqResponse.errors);
        }
        const rfq = rfqResponse.data;
        const rfqResponseById = await this.getById(rfq.id, user);
        return rfqResponseById;
    }

    public async update(request: RfqRequest, user: RequestUserResponse): Promise<ResponseViewModel<RfqResponse>> {
        const rfqResponse = await this.store(request, user);
        if (ResponseViewModel.hasErrors(rfqResponse)) {
            return ResponseViewModel.withErrorModels(rfqResponse.errors);
        }

        // store message in Mail-Queue Table'
        const { data: rfq } = await this.getById(rfqResponse.data.id, user);
        if (request.message && request.status === RfqStatus.active) {
            await this.rfqPublishNotification(rfq, request, user);
        }

        return await this.getById(rfqResponse.data.id, user);
    }

    public async getById(id: string, user?: RequestUserResponse): Promise<ResponseViewModel<RfqResponse>> {
        const rfq = await getRepository(Rfq).findOne(id);
        if (rfq) {
            const transformedResponse = await this.createRfqResponse([rfq], user);
            return ResponseViewModel.with(transformedResponse[0]);
        }

        return ResponseViewModel.withError('invalid rfq-id');
    }

    public async delete(id: string, user: RequestUserResponse): Promise<ResponseViewModel<SuccessResponse>> {
        const rfq = (await this.getById(id, user)).data;

        if (!rfq) {
            return ResponseViewModel.withError('invalid rfq-id');
        }

        if (rfq.status !== RfqStatus.draft) {
            return ResponseViewModel.withError('Only draft RFQs can be deleted!');
        }

        await this.rfqItemService.deleteByRfqID(id);
        await this.rfqSupplierService.deleteByRfqID(id);

        await getRepository(Rfq).delete(id);
        return ResponseViewModel.withSuccess(true);
    }

    public async getAll(
        user: RequestUserResponse,
        searchRequest: RfqSearchRequest,
    ): Promise<ResponseViewModel<PaginatedResponseModel<RfqResponse>>> {
        const page = +(searchRequest.page || 1) > 0 ? +(searchRequest.page || 1) : 1;

        const { status, category_id: categoryId } = searchRequest;
        const query = getRepository(Rfq).createQueryBuilder('rfq');

        if (status) {
            if (user.role === Roles.supplier) {
                const requestedStatus: string[] =
                    status === RfqStatus.lost || status === RfqStatus.won ? [RfqStatus.awarded] : [status];
                if (status === RfqStatus.completed) {
                    requestedStatus.push(RfqStatus.awardrequested);
                }
                query.andWhere('rfq.status in (:...status)', {
                    status: Array.isArray(requestedStatus) ? requestedStatus : [requestedStatus],
                });

                // query.andWhere('rfq.status = :status', { status: requestedStatus });
                status === RfqStatus.won &&
                    query.andWhere('rfq.winner_supplier_id = :supplierId', { supplierId: user.supplier_id });
                status === RfqStatus.lost &&
                    query.andWhere('rfq.winner_supplier_id != :supplierId', { supplierId: user.supplier_id });
            } else {
                query.andWhere('rfq.status = :status', { status });
            }
        }
        if (categoryId) {
            query.andWhere(`rfq.category_ids @> :categoryId`, {
                categoryId: JSON.stringify([categoryId]),
            });
        }

        if (user.role === Roles.supplier) {
            const supplierIds = await this.supplierUserService.getSuppliersIdsByUserId(user.user_id);
            const rfqIds = await this.rfqSupplierService.getRfqIdsBySupplierIds(supplierIds);
            const currentDateTime = new Date();
            query.andWhere('rfq.id in (:...rfqIds)', { rfqIds: rfqIds.length ? rfqIds : [''] });
            query.andWhere('rfq.launch_date <= :current', { current: currentDateTime });
        } else {
            query.andWhere('organisation_id = :organisationId', { organisationId: user.organisation_id });
        }

        const [rfqs, totalItems] = await query
            .skip((page - 1) * Constant.pageSize)
            .take(Constant.pageSize)
            .orderBy('rfq.updated_date', 'DESC')
            .getManyAndCount();

        const data = await this.createRfqResponse(rfqs, user);

        const paginatedData = new PaginatedResponseModel<RfqResponse>(data, totalItems, page);

        return ResponseViewModel.with<PaginatedResponseModel<RfqResponse>>(paginatedData);
    }

    private getRFQStatus(rfq: Rfq, user?: RequestUserResponse): string {
        if (user && user.role === Roles.supplier) {
            if (!rfq.winner_supplier_id) {
                return rfq.status;
            }
            if (rfq.status === Constant.RfqStatus.awardrequested && rfq.winner_supplier_id === user.supplier_id) {
                return rfq.status;
            }
            if (rfq.status === Constant.RfqStatus.awardrequested && rfq.winner_supplier_id !== user.supplier_id) {
                return '';
            }
            if (rfq.winner_supplier_id === user.supplier_id) {
                return 'won';
            }
            return 'lost';
        }
        return rfq.status;
    }

    public async createRfqResponse(rfqs: Rfq[], user?: RequestUserResponse): Promise<RfqResponse[]> {
        if (!rfqs.length) {
            return [];
        }
        const rfqIds = rfqs.map((rfq) => rfq.id);
        const rfqItems = await this.rfqItemService.getRfqItems(rfqIds);
        const rfqSuppliers = await this.rfqSupplierService.getSuppliers(rfqIds);

        const allProductIds = [...new Set(rfqItems.map((rfqItem) => rfqItem.product_id))];
        const allCategoryIds = [...new Set(rfqItems.map((rfqItem) => rfqItem.category_id))];
        const allSupplierIds = [...new Set(rfqSuppliers.map((rfqSupplier) => rfqSupplier.supplier_id))];

        const allProducts = await this.productService.getLightweightByProductIds(allProductIds);
        const allSuppliers = await this.supplierService.getLightweightBySupplierIds(allSupplierIds);

        const supplierIds = rfqSuppliers.map((rfqSupplier) => rfqSupplier.supplier_id);
        const allSupplierUsers = await this.userService.getBySupplierIds(supplierIds);
        const allCategories = (await this.categoryService.getByIds(allCategoryIds, true)).data;

        return rfqs.map(
            (rfq: Rfq): RfqResponse => {
                const data = new RfqResponse();
                data.id = rfq.id;
                data.organisation_id = rfq.organisation_id;
                data.status = this.getRFQStatus(rfq, user);
                data.rfq_number = this.getRFQNumber(rfq.created_date, rfq.rfq_number);
                data.created_date = rfq.created_date;
                data.updated_date = rfq.updated_date;
                data.updated_by = rfq.updated_by;
                data.parameter = rfq.parameter;
                data.negotiation_process = rfq.negotiation_process;

                rfq.winner_supplier_id && (data.winner_supplier_id = rfq.winner_supplier_id);

                const rfqCategoryIds = rfqItems
                    .filter((rfqItem) => rfq.id === rfqItem.rfq_id)
                    .map((rfqItem) => rfqItem.category_id);

                data.categories = allCategories
                    .filter((category) => rfqCategoryIds.includes(category.id))
                    .map((category) => {
                        return { id: category.id, name: category.name };
                    });

                data.items = rfqItems
                    .filter((rfqItem) => rfqItem.rfq_id === rfq.id)
                    .map((rfqItem) => {
                        const product = allProducts.find((product) => product.id === rfqItem.product_id);
                        return {
                            id: rfqItem.id,
                            product_id: rfqItem.product_id,
                            baseline_price: rfqItem.baseline_price,
                            catalog_price: rfqItem.baseline_price,
                            baseline_quantity: rfqItem.baseline_quantity,
                            uom: rfqItem.uom,
                            currency: rfqItem.currency,
                            is_quantity_negotiable: rfqItem.is_quantity_negotiable,
                            name: product.name,
                            category_id: product.category_id,
                        };
                    });

                data.suppliers = rfqSuppliers
                    .filter((rfqSupplier) => rfqSupplier.rfq_id === rfq.id)
                    .map((rfqSupplier) => {
                        const supplier = allSuppliers.find((supplier) => supplier.id === rfqSupplier.supplier_id);
                        const user = allSupplierUsers.find((user) => user.supplier_id === rfqSupplier.supplier_id) || {
                            email: '',
                            name: '',
                        };
                        return {
                            id: supplier.id,
                            name: supplier.name,
                            address: supplier.address,
                            supplier: {
                                email: user.email,
                                name: user.name,
                            },
                        };
                    });
                return data;
            },
        );
    }

    private getRFQNumber(createdDate: Date, rfqNumber: number): string {
        const text = 'RFQ';
        const crDate = new Date(createdDate);
        const year = crDate.getFullYear();
        const month = Util.padDigits(crDate.getMonth() + 1, 2);
        const date = Util.padDigits(crDate.getDate(), 2);
        const paddedRfqNumber = Util.padDigits(rfqNumber, 5);

        return `${text}${year}${month}${date}${paddedRfqNumber}`;
    }

    public async getByIds(ids: string[]): Promise<ResponseViewModel<Rfq[]>> {
        const rfqs = await getRepository(Rfq)
            .createQueryBuilder('rfq')
            .where(`id in (:...ids)`, { ids: ids.length ? ids : [''] })
            .getMany();

        return ResponseViewModel.with(rfqs);
    }

    public async updateRfqStatus(id: string, status: RfqStatus): Promise<void> {
        await getRepository(Rfq).update({ id }, { status });
    }

    private async rfqPublishNotification(
        rfq: RfqResponse,
        request: RfqRequest,
        user: RequestUserResponse,
    ): Promise<void> {
        const launch_date = rfq.negotiation_process.launch_date;
        const deadlines = rfq.negotiation_process.deadlines;
        const rfqSupplierIds = rfq.suppliers.map((rfqSupplier) => rfqSupplier.id) || [];
        const rfqSupplierUsers = await this.userService.getBySupplierIds(rfqSupplierIds);
        const rfqSupplierUserIds = rfqSupplierUsers.map((supplier) => supplier.user_id);
        const userIds = rfqSupplierUserIds.map((u) => {
            return { user_id: u, read: false };
        });
        const mailCreatedByInfo = {
            id: user.user_id,
            name: user.name,
        };
        // Mail-Queue for 'RFQOpened'
        await this.rfqNotificationService.save(
            rfq.id,
            request.message,
            TemplateType.RFQOpened,
            launch_date,
            mailCreatedByInfo,
            userIds,
        );
        // Mail-Queue for 'RFQDeadlineApproaching'
        await Promise.all(
            deadlines.map(
                async (deadline): Promise<void> => {
                    const date = new Date(deadline);
                    const template = (
                        await this.rfqNotificationService.setEmailTemplateByDeadline(
                            rfq,
                            TemplateType.RFQDeadlineApproaching,
                            user.organisation_id,
                            date,
                        )
                    ).data;
                    const subject: string = template.subject;
                    const content: string = template.message;
                    const message = {
                        subject,
                        content,
                    };
                    await this.rfqNotificationService.save(
                        rfq.id,
                        message,
                        TemplateType.RFQDeadlineApproaching,
                        new Date(+date - 1000 * 60 * 60 * 24),
                        mailCreatedByInfo,
                        userIds,
                    );
                    return;
                },
            ),
        );
    }
}
