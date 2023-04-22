import { ResponseViewModel } from '../viewmodels/response-viewmodel';
import { injectable, inject } from 'inversify';
import { ProductResponse } from './../viewmodels/response';
import { ProductServiceContract } from '.';

export interface CategoryProductServiceContract {
    getCategoryProducts(categoryId: string): Promise<ResponseViewModel<ProductResponse[]>>;
}

@injectable()
export class CategoryProductService implements CategoryProductServiceContract {
    public constructor(@inject('ProductService') private readonly productService: ProductServiceContract) {}

    public async getCategoryProducts(categoryId: string): Promise<ResponseViewModel<ProductResponse[]>> {
        const products = await this.productService.getByCategory(categoryId);

        return products;
    }
}
