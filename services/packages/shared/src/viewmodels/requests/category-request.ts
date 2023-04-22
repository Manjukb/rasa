import { Category } from '../../database/models';
import { ICreatedBy } from '../../interfaces';

export class CategoryRequest implements ICreatedBy {
    public id?: string;
    public name: string;
    public sub_category?: string;
    public parent_id?: string;
    public organisation_id: string;
    public tenant_id?: string;
    // public business_type: string;
    public created_by: string;
    public updated_by: string;

    public static toRequest(
        name: string,
        sub_category: string,
        organisation_id: string,
        // business_type: string,
        userId?: string,
        tenantId?: string,
        parentId?: string,
    ): CategoryRequest {
        return {
            name,
            sub_category,
            organisation_id,
            // business_type,
            created_by: userId ?? null,
            updated_by: userId ?? null,
            parent_id: parentId,
            tenant_id: tenantId ?? null,
        };
    }

    public static toModel(me: CategoryRequest): Category {
        const category = new Category();
        if (me.id) {
            category.id = me.id;
        }

        category.organisation_id = me.organisation_id;
        category.name = me.name;
        // category.business_type = me.business_type;
        category.created_by = me.created_by;
        category.updated_by = me.updated_by;

        return category;
    }
}

export class EditOrCreateSubCategoryRequest implements ICreatedBy {
    public id: string;
    public name: string;
    public created_by: string;
    public updated_by: string;
    public is_active: boolean;
}
export class CreateSubCategoryRequest extends EditOrCreateSubCategoryRequest {
    public parent_id: string;
}

export class UpdateCategoryRequest extends EditOrCreateSubCategoryRequest {
    public parent_id?: string;
}
