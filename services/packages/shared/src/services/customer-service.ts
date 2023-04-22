import { Customer } from '../database/models/customer';
import { CustomerHandshakeRequest } from '../viewmodels/requests';
import { EmbedAuthenticationResponse, RequestUserResponse, SuccessResponse } from '../viewmodels/response';
import { ResponseViewModel } from '../viewmodels/response-viewmodel';
import { injectable, inject } from 'inversify';
import { getRepository, getConnection } from 'typeorm';
import { Constant, Util } from '../helpers';
import { TenantServiceContract } from '.';
import { CustomerEmbedValidator, CustomerSaasEmbedValidator } from '../validators';
import { Roles } from '../enum';
import { TenantResponse } from '../viewmodels/response/tenant-response';

export interface CustomerServiceContract {
    getEmbedToken(request: CustomerHandshakeRequest): Promise<ResponseViewModel<EmbedAuthenticationResponse>>;
    getCustomerById(id: string): Promise<Customer>;
    getUser(userId: string, organisationId?: string): Promise<ResponseViewModel<RequestUserResponse>>;
    getCustomer(userId: string, organisationId?: string): Promise<ResponseViewModel<Customer>>;
    setUserIsOnChannel(customerId: string): Promise<boolean>;
}

@injectable()
export class CustomerService implements CustomerServiceContract {
    public constructor(@inject('TenantService') private readonly tenantService: TenantServiceContract) {}
    //#region private methods
    private async validateEmbedRequest(
        customerEmbedRequest: CustomerHandshakeRequest,
    ): Promise<ResponseViewModel<SuccessResponse>> {
        let successOrError: boolean | string[];
        if (customerEmbedRequest.tenant_id) {
            successOrError = await Util.runValidation(customerEmbedRequest, CustomerSaasEmbedValidator);
        } else {
            successOrError = await Util.runValidation(customerEmbedRequest, CustomerEmbedValidator);
        }
        if (successOrError !== true) {
            return ResponseViewModel.withErrors([].concat(...(successOrError as [])));
        }
        return ResponseViewModel.withSuccess();
    }

    private async getCustomerByExternalId(externalId: string, organisationId: string): Promise<Customer> {
        return await getRepository(Customer).findOne({
            where: { organisation_id: organisationId, identifier: externalId },
        });
    }

    public async getCustomerById(id: string): Promise<Customer> {
        return await getRepository(Customer).findOne({
            where: { id },
        });
    }

    private async save(customerRequest: CustomerHandshakeRequest): Promise<Customer> {
        let customer = await this.getCustomerByExternalId(
            customerRequest.customer_id,
            customerRequest.organisation.organisation_id,
        );
        if (!customer) {
            customer = new Customer();
            customer.id = Util.newId();
        }
        customer.identifier = customerRequest.customer_id;
        customer.name = customerRequest.customer_name;
        customer.organisation_id = customerRequest.organisation.organisation_id;

        return await getRepository(Customer).save(customer);
    }
    //#endregion

    public async getEmbedToken(
        request: CustomerHandshakeRequest,
    ): Promise<ResponseViewModel<EmbedAuthenticationResponse>> {
        // validate request
        const { tenant_id } = request;
        const response = new ResponseViewModel<EmbedAuthenticationResponse>();
        const validationResponse = await this.validateEmbedRequest(request);
        if (ResponseViewModel.hasErrors(validationResponse)) {
            response.errors = validationResponse.errors;
            return response;
        }
        let tenantResponse: ResponseViewModel<TenantResponse>;
        if (tenant_id) {
            tenantResponse = await this.tenantService.save(request);
            if (ResponseViewModel.hasErrors(tenantResponse)) {
                response.errors = tenantResponse.errors || [];
                return response;
            }
        }
        const customer = await this.save(request);
        const tokenResponse = new EmbedAuthenticationResponse();
        tokenResponse.token = Util.generateToken({
            organisation_id: request.organisation.organisation_id,
            tenant_id: tenant_id ? tenantResponse.data.id : null,
            role: 'customer',
            id: customer.id,
            user_id: customer.id,
        });
        response.data = tokenResponse;

        return response;
    }

    public async getUser(userId: string): Promise<ResponseViewModel<RequestUserResponse>> {
        const response = new ResponseViewModel<RequestUserResponse>();
        const customerResponse = await this.getCustomer(userId);
        if (ResponseViewModel.hasErrors(customerResponse)) {
            response.errors = customerResponse.errors;

            return response;
        }
        const customer = customerResponse.data;

        response.data = {
            name: customer.name,
            email: customer.identifier,
            user_id: customer.id,
            role: Roles.customer,
            status: customer.is_active,
            organisation_id: customer.organisation_id,
            is_on_channel: customer.is_on_channel,
        };

        return response;
    }

    public async getCustomer(userId: string): Promise<ResponseViewModel<Customer>> {
        const customer = await getConnection()
            .getRepository(Customer)
            .createQueryBuilder('cus')
            .select([
                'cus.id',
                'cus.name',
                'cus.is_active',
                'cus.identifier',
                'cus.is_on_channel',
                'cus.organisation_id',
            ])
            .where('cus.id = :id', { id: userId })
            .getOne();

        if (!customer) {
            return ResponseViewModel.withError('Invalid customer id');
        }

        if (!customer.is_active) {
            return ResponseViewModel.withError(Constant.ERROR_MESSAGES.ACCOUNT_DEACTIVATED);
        }

        return ResponseViewModel.with<Customer>(customer);
    }

    public async setUserIsOnChannel(customerId: string): Promise<boolean> {
        await getRepository(Customer).update({ id: customerId }, { is_on_channel: true });

        return true;
    }
}
