import { Constant } from '../../helpers';

export class PaginatedResponseModel<T> {
    public total: number;
    public per_page: number;
    public current_page: number;
    public data: T[];
    public page_count: number;
    public page_index: number;
    public page_size: number;
    public is_notification?: boolean;
    public total_unread: number;

    public constructor(data: T[] = [], total = 0, current_page = 0, total_unread = 0) {
        this.per_page = Constant.pageSize;
        this.total = total;
        this.current_page = current_page;
        this.page_index = current_page;
        this.page_size = Constant.pageSize;
        this.page_count = Math.ceil(total / this.per_page);
        this.total_unread = total_unread;
        this.data = data;
    }

    // public setDefaultsValueForNoResult(): void {
    //     this.per_page = Constant.pageSize;
    //     this.total = 0;
    //     this.current_page = 1;
    //     this.page_index = 1;
    //     this.page_size = Constant.pageSize;
    //     this.page_count = 1;
    //     this.data = [];
    // }
}
