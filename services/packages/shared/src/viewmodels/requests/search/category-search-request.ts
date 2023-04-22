import { PaginatorRequest } from './paginator-request';

export class CategorySearchRequest extends PaginatorRequest {
    public id?: string;
    public name?: string;
    public parent_id?: string;
    public business_type?: string;
    public organisation_id?: number;
    public active?: string;
}
