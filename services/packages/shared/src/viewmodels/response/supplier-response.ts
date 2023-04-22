import { User } from '../../database/models';

export class SupplierLightWeightResponse {
    public id: string;
    public name: string;
    public email: string;
    public phone: string;
    public created_date: Date;

    public static fromModel(supplier: User): SupplierLightWeightResponse {
        const { user_id: id, name, email, phone, created_date } = supplier;
        return {
            id,
            name,
            email,
            phone,
            created_date,
        };
    }
}
