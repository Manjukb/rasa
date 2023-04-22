import { ErrorModel, ResponseViewModel } from '../viewmodels/response-viewmodel';
import { OrganisationResponse, PaginatedResponseModel, SuccessResponse, UserResponse } from '../viewmodels/response';

import { Organisation } from '../database/models';
import { OrganisationRequest, OrganisationWithAdminRequest, UpdateOrganisationRequest } from '../viewmodels/requests';
import { OrganisationResponseTransformer, UserResponseTransformer } from '../transformer';
import { getRepository } from 'typeorm';
import { inject, injectable } from 'inversify';
import { UserOrganisationServiceContract } from './user-organisation-service';
import { MailServiceContract } from './mail-service';
import { ApiKeyServiceContract } from './api-key-service';
import { WelcomeEmail } from '../types';
import { Constant, PaginatorRequest, SettingServiceContract } from '..';

export interface OrganisationServiceContract {
    create(request: OrganisationWithAdminRequest): Promise<ResponseViewModel<SuccessResponse>>;
    createOld(organisationRequest: OrganisationRequest): Promise<ResponseViewModel<SuccessResponse>>;
    update(
        organisationId: string,
        organisationRequest: UpdateOrganisationRequest,
    ): Promise<ResponseViewModel<SuccessResponse>>;
    getLightWeightList(
        paginatorRequest: PaginatorRequest,
    ): Promise<ResponseViewModel<PaginatedResponseModel<OrganisationResponse>>>;
    getLightWeight(organisationId: string): Promise<ResponseViewModel<OrganisationResponse>>;
    getOrganisationUsers(orgId: string): Promise<ResponseViewModel<UserResponse[]>>;
    getOrganisationTimeZone(orgId: string): Promise<string>;
    getById(id: string): Promise<ResponseViewModel<Organisation>>;
    getByOrgIds(ids: string[]): Promise<Organisation[]>;
}
@injectable()
export class OrganisationService implements OrganisationServiceContract {
    public constructor(
        @inject('MailService') private readonly mailService: MailServiceContract,
        @inject('UserOrganisationService') private readonly userOrganisationService: UserOrganisationServiceContract,
        @inject('ApiKeyService') private readonly apiKeyService: ApiKeyServiceContract,
        @inject('SettingService') private readonly settingService: SettingServiceContract,
    ) {}

    public async getById(organisationId: string): Promise<ResponseViewModel<Organisation>> {
        const response = new ResponseViewModel<Organisation>();
        const organisation = await getRepository(Organisation)
            .createQueryBuilder('organisation')
            .leftJoinAndSelect('organisation.apiKeys', 'api_key')
            .where('organisation.organisation_id = :organisationId', { organisationId })
            .getOne();

        if (organisation) {
            response.data = organisation;

            return response;
        }
        response.errors.push(new ErrorModel('No organisation exists with passed id', 'id'));

        return response;
    }

    public async getLightWeightList(
        paginatorRequest: PaginatorRequest,
    ): Promise<ResponseViewModel<PaginatedResponseModel<OrganisationResponse>>> {
        const page = +(paginatorRequest.page || 1) > 0 ? +(paginatorRequest.page || 1) : 1;
        const [organisations, count] = await getRepository(Organisation)
            .createQueryBuilder('organisation')
            .leftJoinAndSelect('organisation.apiKeys', 'api_key')
            .skip((page - 1) * Constant.pageSize)
            .take(Constant.pageSize)
            .orderBy('organisation.created_date', 'DESC')
            .getManyAndCount();

        const data = OrganisationResponseTransformer.transformList(organisations);
        const paginatedData = new PaginatedResponseModel<OrganisationResponse>(data, count, page);

        return ResponseViewModel.with<PaginatedResponseModel<OrganisationResponse>>(paginatedData);
    }

    public async getLightWeight(organisationId: string): Promise<ResponseViewModel<OrganisationResponse>> {
        const response = new ResponseViewModel<OrganisationResponse>();
        const organisationByIdResponse = await this.getById(organisationId);

        if (organisationByIdResponse.errors.length) {
            response.errors = organisationByIdResponse.errors;

            return response;
        }

        response.data = OrganisationResponseTransformer.transform(organisationByIdResponse.data);

        return response;
    }

    public async createOld(organisationRequest: OrganisationRequest): Promise<ResponseViewModel<SuccessResponse>> {
        const response = new ResponseViewModel<SuccessResponse>();
        const organisation = new Organisation();

        organisationRequest.organisation_info = { name: organisationRequest.organisation_id, status: 'active' };
        organisation.business_type = organisationRequest.business_types.toString();
        delete organisationRequest.business_types;
        Object.assign(organisation, organisationRequest);

        await getRepository(Organisation).save(organisation);
        response.data = { success: true };

        return response;
    }

    public async update(
        organisationId: string,
        organisationRequest: UpdateOrganisationRequest,
    ): Promise<ResponseViewModel<SuccessResponse>> {
        const response = new ResponseViewModel<SuccessResponse>();
        const organisation = await getRepository(Organisation).findOne({ organisation_id: organisationId });
        if (organisation) {
            organisation.organisation_info.name = organisationRequest.name;
            organisation.name = organisationRequest.name;
            organisation.timezone = organisationRequest.timezone;
            organisation.updated_by = organisationRequest.updated_by;
            organisation.business_type = organisationRequest.business_types.toString();
            organisation.domains = organisationRequest.domains.join(',');
            organisation.updated_by = organisationRequest.updated_by;

            await getRepository(Organisation).save(organisation);
            response.data = { success: true };

            return response;
        }
        response.errors.push(new ErrorModel('Invalid Id', 'organisation-id'));

        return response;
    }

    public async getList(): Promise<Organisation[]> {
        const data = await getRepository(Organisation).find({
            select: ['id', 'organisation_id'],
        });

        return data;
    }

    public async getOrganisationUsers(orgId: string): Promise<ResponseViewModel<UserResponse[]>> {
        const response = new ResponseViewModel<UserResponse[]>();

        const organisation = await getRepository(Organisation)
            .createQueryBuilder('org')
            .leftJoinAndSelect('org.users', 'user')
            .where('user.authority != :authority', { authority: 'supplier' })
            .andWhere('org.organisation_id = :orgId', { orgId })
            .getOne();

        if (!organisation) {
            response.errors.push(new ErrorModel(`Organisation not found`, 'organisation-id'));

            return response;
        }

        if (!organisation.users.length) {
            response.errors.push(new ErrorModel(`No user is associated with Org:${organisation.name}`, 'no-user'));

            return response;
        }

        const users = organisation.users;
        delete organisation.users;

        users.forEach((user) => {
            user.organisation = organisation;
        });

        const data = UserResponseTransformer.transformList(users);
        response.data = data;

        return response;
    }

    public async getOrganisationTimeZone(orgId: string): Promise<string> {
        const organisation = await getRepository(Organisation)
            .createQueryBuilder('org')
            .where('org.organisation_id = :orgId', { orgId })
            .getOne();
        return organisation.timezone;
    }

    public async create(request: OrganisationWithAdminRequest): Promise<ResponseViewModel<SuccessResponse>> {
        const response = new ResponseViewModel<SuccessResponse>();

        const { organisation, user } = (await this.userOrganisationService.createOrganisationAndAdmin(request)).data;
        user.organisation = organisation;
        const businessTypes = request.business_types;

        businessTypes.map(
            async (businessType: string): Promise<void> => {
                await this.apiKeyService.create({
                    authority: user.authority,
                    organisation_id: organisation.organisation_id,
                    user_id: user.user_id,
                    business_type: businessType,
                });
            },
        );

        const welcomeEmail: WelcomeEmail = {
            client_name: organisation.name,
            name: user.name,
            email: user.email,
            password_key: user.password_key,
        };

        const settingRequest = {
            data: 'false',
            organisation_id: user.organisation_id,
        };
        await this.settingService.create(settingRequest);
        await this.mailService.sendWelcomeMail(welcomeEmail);
        response.data = { success: true };

        return response;
    }

    public async getByOrgIds(ids: string[]): Promise<Organisation[]> {
        const orgs = await getRepository(Organisation)
            .createQueryBuilder('org')
            .where('organisation_id in (:...ids)', {
                ids: ids.length ? ids : [''],
            })
            .getMany();

        return orgs;
    }
}
