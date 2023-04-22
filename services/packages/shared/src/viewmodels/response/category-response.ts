import { Category } from '../../database/models';

type SubCategory = {
    id: string;
    name: string;
    parent_id: string;
    parent_name: string;
    is_active: boolean;
};

export class CategoryResponse {
    public id: string;
    public name: string;
    public is_active: boolean;
    public created_date: Date;
    public updated_date: Date;
    public sub_category?: SubCategory[];

    public static fromModel(category: Category, subCategories: Category[]): CategoryResponse {
        const { id, name, is_active, created_date, updated_date } = category;
        const filteredSubCategories = subCategories.filter((s) => s.parent_id === id);
        const parentId = id;
        const transformedSubCategories = filteredSubCategories.map(
            (f): SubCategory => {
                return {
                    id: f.id,
                    name: f.name,
                    parent_id: parentId,
                    parent_name: name,
                    is_active: f.is_active,
                };
            },
        );
        return {
            id,
            name,
            is_active,
            created_date,
            updated_date,
            sub_category: transformedSubCategories,
        };
    }

    public static fromModels(categories: Category[], subCategories: Category[]): CategoryResponse[] {
        return categories.map((category) => CategoryResponse.fromModel(category, subCategories));
    }
}

export class LightweightCategoryResponse {
    public id: string;
    public name: string;

    public static fromModel(category: Category): LightweightCategoryResponse {
        return { id: category.id, name: category.name };
    }
    public static fromModels(categories: Category[]): LightweightCategoryResponse[] {
        return categories.map((category) => LightweightCategoryResponse.fromModel(category));
    }
}
