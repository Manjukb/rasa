import { ICreatedBy } from '../../interfaces';

export class AddUpdateProductRequest implements ICreatedBy {
    public id: string;
    public name: string;
    public product_code?: string;
    public category_id: string;
    public sub_category_id: string;
    public description_1?: string;
    public description_2?: string;
    public created_by: string;
    public updated_by: string;
    public is_active: boolean;
    public uom: string;
    public price: number;
    public currency: string;
    public is_manual_nego: boolean;
}

export class AddUpdateSaasProductRequest implements ICreatedBy {
    public id: string;
    public organisation_id: string;
    public user_id: string;
    public name: string;
    public product_code?: string;
    public category: string;
    public sub_category: string;
    public description_1?: string;
    public description_2?: string;
    public is_active: boolean;
    public uom: string;
    public price: number;
    public currency: string;
    public created_by: string;
    public updated_by: string;
}
