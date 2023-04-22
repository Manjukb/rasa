import { injectable, inject } from 'inversify';

import { SupplierImportRequest } from '../viewmodels/requests';
import { Supplier, SupplierUser, User } from '../database/models';
import { BusinessType, Constant, eventSink, Roles, Util } from '..';
import { UserServiceContract } from '.';
import { getRepository } from 'typeorm';

export interface SupplierUserServiceContract {
    getOrCreateSupplierUser(request: SupplierImportRequest, supplier: Supplier): Promise<User>;
    saveSupplierUserMapping(supplier: Supplier, user: User): Promise<void>;
    getSuppliersUserIds(supplierIds: string[]): Promise<string[]>;
    getSuppliersUsers(supplierIds: string[]): Promise<SupplierUser[]>;
    getSuppliersIdsByUserId(userId: string): Promise<string[]>;
}

@injectable()
export class SupplierUserService implements SupplierUserServiceContract {
    public constructor(@inject('UserService') private readonly userService: UserServiceContract) {}

    public async getOrCreateSupplierUser(request: SupplierImportRequest, supplier: Supplier): Promise<User> {
        const email = request.email.toLowerCase();
        const userByEmail = (await this.userService.getByEmail(email)).data;
        if (userByEmail) {
            const isSamePhone = request.phone === userByEmail.phone;
            if (!isSamePhone) {
                userByEmail.phone = request.phone;
                await getRepository(User).save(userByEmail);
            }
            return userByEmail;
        }

        const newSupplier: User = new User();
        newSupplier.user_id = Util.guid();
        newSupplier.supplier_id = supplier.id;
        newSupplier.email = request.email;
        newSupplier.name = request.name;
        newSupplier.phone = request.phone;
        newSupplier.user_info = { authority: Roles.supplier, name: request.name, email };
        newSupplier.password_hash = Util.hashPassword(newSupplier.user_id);
        newSupplier.password_key = Util.guid();
        newSupplier.authority = Roles.supplier;
        newSupplier.user_info = { authority: Roles.supplier, name: request.name, email };
        newSupplier.organisation = null;
        newSupplier.business_type = BusinessType.procurement;
        newSupplier.password_key_valid_till = new Date(new Date().setDate(new Date().getDate() + 10));
        newSupplier.user_status = true;
        newSupplier.created_by = request.created_by;
        newSupplier.updated_by = request.updated_by;
        newSupplier.organisation_id = request.organisation_id;
        await this.userService.save(newSupplier);
        eventSink.raiseEvent(Constant.SupplierImportEvents.onSupplierOnBoarded, newSupplier);

        return newSupplier;
    }

    public async saveSupplierUserMapping(supplier: Supplier, user: User): Promise<void> {
        const supplierUser = await getRepository(SupplierUser).findOne({
            supplier_id: supplier.id,
            user_id: user.user_id,
        });
        if (supplierUser) {
            return;
        }
        await getRepository(SupplierUser).save({ id: Util.guid(), supplier_id: supplier.id, user_id: user.user_id });

        return;
    }

    public async getSuppliersUserIds(supplierIds: string[]): Promise<string[]> {
        const supplierUsers = await getRepository(SupplierUser)
            .createQueryBuilder()
            .where('supplier_id in (:...supplierIds)', {
                supplierIds: supplierIds.length ? supplierIds : [''],
            })
            .getMany();

        const userIds = supplierUsers.map((supplierUser) => supplierUser.user_id);

        return userIds;
    }

    public async getSuppliersUsers(supplierIds: string[]): Promise<SupplierUser[]> {
        const supplierUsers = await getRepository(SupplierUser)
            .createQueryBuilder()
            .where('supplier_id in (:...supplierIds)', {
                supplierIds: supplierIds.length ? supplierIds : [''],
            })
            .getMany();

        return supplierUsers;
    }

    public async getSuppliersIdsByUserId(userId: string): Promise<string[]> {
        const supplierUsers = await getRepository(SupplierUser)
            .createQueryBuilder()
            .where('user_id =:userId', { userId })
            .getMany();

        const supplierIds = supplierUsers.map((supplierUser) => supplierUser.supplier_id);

        return [...new Set(supplierIds)];
    }
}
