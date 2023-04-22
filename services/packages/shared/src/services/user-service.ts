import { nanoid } from 'nanoid';
import { ErrorModel, ResponseViewModel } from '../viewmodels/response-viewmodel';
import { ClientResponse } from '@sendgrid/client/src/response';

import {
    ClientAdminRequest,
    HandshakeRequest,
    SetPasswordRequest,
    UpdatePasswordRequest,
    UpdateUserRequest,
    UserRequest,
} from '../viewmodels/requests';
import { ClientType, Roles } from '../enum';
import {
    EmbedAuthenticationResponse,
    MessageResponse,
    RequestUserResponse,
    SuccessResponse,
    UserResponse,
} from '../viewmodels/response';
import { Organisation, User } from '../database/models';
import { getRepository } from 'typeorm';
import { inject, injectable } from 'inversify';
import { v4 as uuidv4 } from 'uuid';
import { MailServiceContract } from './index';
import { UserOrganisationServiceContract } from './user-organisation-service';
import { RequestUserResponseTransformer, UserResponseTransformer } from '../transformer';
import { WelcomeEmail } from '../types';
import { PermissionServiceContract } from './permission-service';
import { Constant, Util } from '../helpers';
import { eventSink } from '../factories';
import { OrganisationCompanySupplier } from '../database/models/organisation-company-supplier';

export interface UserServiceContract {
    getLightWeightList(user: RequestUserResponse): Promise<ResponseViewModel<UserResponse[]>>;
    getLightWeight(user: RequestUserResponse): Promise<ResponseViewModel<UserResponse>>;
    createClientAdmin(adminRequest: ClientAdminRequest): Promise<ResponseViewModel<SuccessResponse>>;
    createEnterpriseUser(enterpriseUserRequest: UserRequest): Promise<ResponseViewModel<SuccessResponse>>;
    sendWelcomeMail(user: User): Promise<ResponseViewModel<ClientResponse>>;
    getUserToAuth(email: string): Promise<ResponseViewModel<User>>;
    sendForgotPasswordEmail(email: string): Promise<ResponseViewModel<MessageResponse>>;
    getUserByPasswordKey(passwordKey: string): Promise<ResponseViewModel<User>>;
    setUserPassword(setPasswordRequest: SetPasswordRequest): Promise<ResponseViewModel<MessageResponse>>;
    updatePassword(
        userId: string,
        updatePasswordRequest: UpdatePasswordRequest,
    ): Promise<ResponseViewModel<SuccessResponse>>;
    update(
        user: RequestUserResponse,
        updateUserRequest: UpdateUserRequest,
    ): Promise<ResponseViewModel<SuccessResponse>>;
    createUser(user: RequestUserResponse, useRequest: UserRequest): Promise<ResponseViewModel<SuccessResponse>>;
    updateStatus(user: RequestUserResponse, requestedUserId: string): Promise<ResponseViewModel<SuccessResponse>>;
    getEmbedToken(request: HandshakeRequest): Promise<ResponseViewModel<EmbedAuthenticationResponse>>;
    getUser(userId: string): Promise<ResponseViewModel<RequestUserResponse>>;
    setUserIsOnChannel(userId: string): Promise<boolean>;

    getByEmail(email: string): Promise<ResponseViewModel<User>>;
    save(user: User): Promise<User>;
    getByIds(userIds: string[]): Promise<User[]>;
    getBySupplierIds(userIds: string[]): Promise<User[]>;
}
@injectable()
export class UserService implements UserServiceContract {
    public constructor(
        @inject('MailService') private readonly mailService: MailServiceContract,
        @inject('PermissionService') private readonly permissionService: PermissionServiceContract,
        @inject('UserOrganisationService') private readonly userOrganisationService: UserOrganisationServiceContract,
    ) {}

    private async getById(userId: string): Promise<ResponseViewModel<User>> {
        const response = new ResponseViewModel<User>();
        const user = await getRepository(User)
            .createQueryBuilder('user')
            .leftJoinAndSelect('user.organisation', 'organisation')
            .where('user.user_id = :user_id', { user_id: userId })
            .getOne();

        if (user) {
            response.data = user;

            return response;
        }
        response.errors.push(new ErrorModel('Invalid user id', 'id'));

        return response;
    }

    private async getAll(user: RequestUserResponse): Promise<ResponseViewModel<User[]>> {
        const organisationId = user.role === Roles.super_admin ? '' : user.organisation_id;
        const response = new ResponseViewModel<User[]>();
        const queryBuilder = getRepository(User)
            .createQueryBuilder('user')
            .innerJoinAndSelect('user.organisation', 'organisation');
        if (organisationId) {
            queryBuilder.where('user.organisation_id = :organisation_id', { organisation_id: organisationId });
        }

        const users = await queryBuilder.orderBy('user.created_date', 'DESC').getMany();
        response.data = users;

        return response;
    }

    public async getLightWeightList(user: RequestUserResponse): Promise<ResponseViewModel<UserResponse[]>> {
        const response = new ResponseViewModel<UserResponse[]>();
        const users = (await this.getAll(user)).data;
        if (users) {
            const data = UserResponseTransformer.transformList(users);
            response.data = data;
        }
        return response;
    }

    public async getLightWeight(data: RequestUserResponse): Promise<ResponseViewModel<UserResponse>> {
        const response = new ResponseViewModel<UserResponse>();
        const user = (await this.getById(data.user_id)).data;
        if (user) {
            const data = UserResponseTransformer.transform(user);
            response.data = data;

            return response;
        }
        response.errors.push(new ErrorModel('Invalid user id', 'id'));

        return response;
    }

    public async createClientAdmin(adminRequest: ClientAdminRequest): Promise<ResponseViewModel<SuccessResponse>> {
        const response = new ResponseViewModel<SuccessResponse>();

        const organisation = (
            await this.userOrganisationService.getOrganisation({ organisationId: adminRequest.organisation_id })
        ).data;

        const user = new User();
        user.password_hash = uuidv4();
        user.user_id = nanoid(20);
        user.email = adminRequest.email;

        user.hashPassword();
        user.password_key = uuidv4();
        user.authority =
            organisation.client_type === ClientType['saas-based'] ? Roles.enterprise_admin : Roles.saas_admin;

        adminRequest.user_info = { name: adminRequest.name, email: adminRequest.email, authority: user.authority };

        user.user_status = true;
        user.password_key_valid_till = new Date(new Date().setDate(new Date().getDate() + 10));

        Object.assign(user, adminRequest);
        await getRepository(User).save(user);

        user.organisation = organisation;

        await this.sendWelcomeMail(user);

        response.data = { success: true };

        return response;
    }

    public async createEnterpriseUser(enterpriseUserRequest: UserRequest): Promise<ResponseViewModel<SuccessResponse>> {
        const organisation = (
            await this.userOrganisationService.getOrganisation({
                organisationId: enterpriseUserRequest.organisation_id,
            })
        ).data;
        enterpriseUserRequest.organisation_id = organisation.organisation_id;

        const response = new ResponseViewModel<SuccessResponse>();
        const user = new User();
        user.password_hash = uuidv4();
        user.user_id = enterpriseUserRequest.email;
        user.user_info = {
            name: enterpriseUserRequest.name,
            email: enterpriseUserRequest.email,
            authority: Roles.enterprise_user,
        };
        user.hashPassword();
        user.password_key = uuidv4();
        user.authority = Roles.enterprise_user;
        user.user_status = true;
        user.business_type = enterpriseUserRequest.business_types.toString();

        user.password_key_valid_till = new Date(new Date().setDate(new Date().getDate() + 10));

        Object.assign(user, enterpriseUserRequest);
        user.email = enterpriseUserRequest.email;
        await getRepository(User).save(user);

        user.organisation = organisation;

        await this.sendWelcomeMail(user);

        response.data = { success: true };

        return response;
    }

    public async sendWelcomeMail(user: User): Promise<ResponseViewModel<ClientResponse>> {
        const response = new ResponseViewModel<ClientResponse>();
        const welcomeEmail: WelcomeEmail = {
            client_name: user.organisation.name,
            name: user.name,
            email: user.email,
            password_key: user.password_key,
        };

        const mailerResponse = await this.mailService.sendWelcomeMail(welcomeEmail);

        response.data = mailerResponse;

        return response;
    }

    public async sendForgotPasswordEmail(email: string): Promise<ResponseViewModel<MessageResponse>> {
        const response = new ResponseViewModel<MessageResponse>();
        const user = (await this.userOrganisationService.getUser({ email })).data;
        if (!user) {
            response.errors.push(new ErrorModel(`No user found by email address '${email}'`));

            return response;
        }

        const isKeyValidResponse = this.isUserPasswordKeyValid(user);
        if (isKeyValidResponse.errors.length) {
            user.password_key = uuidv4();
            user.password_key_valid_till = new Date(new Date().setDate(new Date().getDate() + 10));
            await getRepository(User).save(user);
        }

        const user1 = (await this.getById(user.user_id)).data;

        const welcomeEmail: WelcomeEmail = {
            client_name: user1.organisation ? user1.organisation.name : '',
            name: user1.name,
            email: user1.email,
            password_key: user1.password_key,
        };

        await this.mailService.sendForgotPasswordMail(welcomeEmail);

        response.data = { message: `A reset password email is successfully sent on ${user1.email}.` };

        return response;
    }

    public async getUserToAuth(email: string): Promise<ResponseViewModel<User>> {
        const response = new ResponseViewModel<User>();
        const user = await getRepository(User)
            .createQueryBuilder('user')
            .select([
                'user.id',
                'user.organisation_id',
                'user.user_id',
                'user.email',
                'user.name',
                'user.authority',
                'user.password_hash',
                'user.user_status',
                'user.business_type',
            ])
            .where('email = :email', { email: email })
            .getOne();
        if (user) {
            const organisation = (
                await this.userOrganisationService.getOrganisation({ organisationId: user.organisation_id })
            ).data;
            user.organisation = organisation;
            response.data = user;

            return response;
        }
        response.errors.push(new ErrorModel(`UserId/Email address doesn't belong to any user`));

        return response;
    }

    public isUserPasswordKeyValid(user: User): ResponseViewModel<SuccessResponse> {
        const response = new ResponseViewModel<SuccessResponse>();

        if (!user.password_key) {
            response.errors.push(
                new ErrorModel('Password key is not set Please re-generate kay again', 'password-key'),
            );

            return response;
        }

        const currentTimeStamp = new Date().getTime();
        const passwordKeyValidTillTimeStamp = new Date(user.password_key_valid_till).getTime();

        if (passwordKeyValidTillTimeStamp > currentTimeStamp) {
            response.data = { success: true };

            return response;
        }

        response.errors.push(new ErrorModel('It seems password-key is expired', 'password-key'));

        return response;
    }

    public async getUserByPasswordKey(passwordKey: string): Promise<ResponseViewModel<User>> {
        const response = new ResponseViewModel<User>();
        const user = await getRepository(User).findOne({ password_key: passwordKey });
        if (user) {
            const isKeyValidResponse = this.isUserPasswordKeyValid(user);
            if (isKeyValidResponse.data && isKeyValidResponse.data.success) {
                response.data = user;

                return response;
            }
            response.errors = isKeyValidResponse.errors;

            return response;
        }

        response.errors.push(new ErrorModel('Invalid password key', 'password-key'));

        return response;
    }

    public async setUserPassword(setPasswordRequest: SetPasswordRequest): Promise<ResponseViewModel<MessageResponse>> {
        const response = new ResponseViewModel<MessageResponse>();
        const responseByPasswordKey = await this.getUserByPasswordKey(setPasswordRequest.password_key);

        if (responseByPasswordKey.data) {
            const user = responseByPasswordKey.data;
            user.password_hash = setPasswordRequest.password;
            user.hashPassword();
            user.password_key = '';
            await getRepository(User).save(user);

            response.data = { message: 'Password updated successfully' };

            return response;
        }

        response.errors = responseByPasswordKey.errors;

        return response;
    }

    public async updatePassword(
        userId: string,
        updatePasswordRequest: UpdatePasswordRequest,
    ): Promise<ResponseViewModel<SuccessResponse>> {
        const response = new ResponseViewModel<SuccessResponse>();

        const user = await getRepository(User).findOne({ user_id: userId });
        user.password_hash = updatePasswordRequest.password;
        user.hashPassword();
        await getRepository(User).save(user);
        response.data = { success: true };

        return response;
    }

    public async update(
        user: RequestUserResponse,
        updateUserRequest: UpdateUserRequest,
    ): Promise<ResponseViewModel<SuccessResponse>> {
        const response = new ResponseViewModel<SuccessResponse>();
        const hasAccess = await this.permissionService.canUpdateUser(user, updateUserRequest.id);

        if (hasAccess.errors && hasAccess.errors.length) {
            response.errors = hasAccess.errors;

            return response;
        }

        const role = user.role;
        const isAdmin = role !== Roles.enterprise_user;
        const dbUser = await getRepository(User).findOne({ user_id: updateUserRequest.id });

        if (!dbUser) {
            response.errors.push(new ErrorModel('Invalid user-id passed', 'user-id'));

            return response;
        }

        dbUser.name = updateUserRequest.name;
        dbUser.email = updateUserRequest.email;
        dbUser.updated_by = updateUserRequest.updated_by;
        dbUser.user_info = { authority: dbUser.authority, name: dbUser.name, email: dbUser.email };

        if (isAdmin) {
            dbUser.business_type = updateUserRequest.business_types.join(',');
        }

        await getRepository(User).save(dbUser);
        response.data = { success: true };

        return response;
    }

    public async createUser(
        user: RequestUserResponse,
        userRequest: UserRequest,
    ): Promise<ResponseViewModel<SuccessResponse>> {
        const response = new ResponseViewModel<SuccessResponse>();
        const organisation = (
            await this.userOrganisationService.getOrganisation({ organisationId: user.organisation_id })
        ).data;

        const newUser = new User();
        newUser.user_id = nanoid(20);
        newUser.name = userRequest.name;
        newUser.organisation_id = organisation.organisation_id;
        newUser.email = userRequest.email;
        newUser.authority = userRequest.role;
        newUser.user_info = { name: newUser.name, email: newUser.email, authority: newUser.authority };
        newUser.created_by = userRequest.created_by;
        newUser.updated_by = userRequest.updated_by;
        newUser.password_hash = uuidv4();
        newUser.password_key = uuidv4();
        newUser.user_status = true;
        newUser.hashPassword();
        newUser.business_type = userRequest.business_types.join(',');
        newUser.password_key_valid_till = new Date(new Date().setDate(new Date().getDate() + 10));

        await getRepository(User).save(newUser);
        newUser.organisation = organisation;
        await this.sendWelcomeMail(newUser);
        response.data = { success: true };

        return response;
    }

    public async updateStatus(
        user: RequestUserResponse,
        requestedUserId: string,
    ): Promise<ResponseViewModel<SuccessResponse>> {
        const response = new ResponseViewModel<SuccessResponse>();

        if (!requestedUserId) {
            response.errors.push(new ErrorModel('Invalid user-id', 'user-id'));

            return response;
        }

        const requestedUser = await getRepository(User).findOne({ user_id: requestedUserId });

        if (!requestedUser) {
            response.errors.push(new ErrorModel('No user found with passed user-id.', 'user-id'));

            return response;
        }

        if (user.organisation_id !== requestedUser.organisation_id) {
            response.errors.push(new ErrorModel(`User doesn't belong your organisation.`, 'user-id'));

            return response;
        }

        if (user.user_id === requestedUserId) {
            response.errors.push(new ErrorModel(`A user can't activate / de-activate self.`, 'user-id'));

            return response;
        }

        const organisationAdmins = await this.getOrganisationAdminCount(requestedUser.organisation_id);

        if (
            Constant.clientAdminRoles.includes(requestedUser.authority) &&
            organisationAdmins === 1 &&
            requestedUser.user_status === true
        ) {
            response.errors.push(
                new ErrorModel(`User can't be deactivated, at least one admin should be active.`, 'user-id'),
            );

            return response;
        }

        const operation = requestedUser.user_status ? 'deactivated' : 'activated';
        requestedUser.user_status = !requestedUser.user_status;
        await getRepository(User).save(requestedUser);
        response.data = { success: true, message: `user is ${operation} successfully` };

        return response;
    }

    private async getOrganisationAdminCount(organisationId: string): Promise<number> {
        const count = await getRepository(User)
            .createQueryBuilder('user')
            .where('user.organisation_id = :organisationId', { organisationId })
            .andWhere('user.user_status = true')
            .getCount();

        return count;
    }

    public async getEmbedToken(request: HandshakeRequest): Promise<ResponseViewModel<EmbedAuthenticationResponse>> {
        const response = new ResponseViewModel<EmbedAuthenticationResponse>();
        // to do here
        console.info({ request });

        return response;
    }

    public async getUser(userId: string): Promise<ResponseViewModel<RequestUserResponse>> {
        const response = new ResponseViewModel<RequestUserResponse>();
        const user = await getRepository(User).findOne({
            user_id: userId,
        });

        if (!user) {
            response.errors.push(new ErrorModel(Constant.ERROR_MESSAGES.DEFAULT_TOKEN_ERROR));

            return response;
        }
        if (!user.user_status) {
            response.errors.push(new ErrorModel(Constant.ERROR_MESSAGES.ACCOUNT_DEACTIVATED));

            return response;
        }

        response.data = RequestUserResponseTransformer.transform(user);

        return response;
    }

    public async setUserIsOnChannel(userId: string): Promise<boolean> {
        // to be done while working on enterprise client
        console.info({ userId });
        return true;
    }

    public async saveOrganisationCompanySupplier(
        company: Organisation,
        supplier: User,
        organisationId: string,
    ): Promise<void> {
        const res = await getRepository(OrganisationCompanySupplier).findOne({
            where: { company_id: company.organisation_id, organisation_id: organisationId, user_id: supplier.user_id },
        });
        if (!res) {
            const organisationCompanySupplier = new OrganisationCompanySupplier();
            organisationCompanySupplier.id = Util.guid();
            organisationCompanySupplier.organisation_id = organisationId;
            organisationCompanySupplier.user_id = supplier.user_id;
            organisationCompanySupplier.company_id = company.organisation_id;

            await getRepository(OrganisationCompanySupplier).save(organisationCompanySupplier);
            eventSink.raiseEvent(Constant.SupplierImportEvents.onNewClientHandShaken, {
                name: supplier.name,
                email: supplier.email,
                company_name: company.name,
                company_id: company.organisation_id,
                supplier_id: supplier.user_id,
            });
        }
    }

    public async getByEmail(email: string): Promise<ResponseViewModel<User>> {
        // const response = new ResponseViewModel<User>();
        const user = await getRepository(User)
            .createQueryBuilder('user')
            .where(`LOWER(email) = :email`, { email: email.toLocaleLowerCase() })
            .getOne();
        if (user) {
            return ResponseViewModel.with(user);
        }
        return ResponseViewModel.withError('No user found with email');
    }

    public async save(user: User): Promise<User> {
        const supplierUser = await getRepository(User).save(user);

        return supplierUser;
    }

    public async getByIds(userIds: string[]): Promise<User[]> {
        const users = await getRepository(User)
            .createQueryBuilder()
            .where('user_id in (:...userIds)', {
                userIds: userIds.length ? userIds : [''],
            })
            .getMany();

        return users;
    }

    public async getBySupplierIds(supplierIds: string[]): Promise<User[]> {
        const users = await getRepository(User)
            .createQueryBuilder('user')
            .select(['user.id', 'user.user_id', 'user.supplier_id', 'user.name', 'user.email', 'user.phone'])
            .where('supplier_id in (:...supplierIds)', {
                supplierIds: supplierIds.length ? supplierIds : [''],
            })
            .getMany();

        return users;
    }
}
