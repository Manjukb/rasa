export class PageRequest {
    public sort_by?: string;
    public sort_order?: string;
    public page?: number;
    public status?: string;
    public read?: string;
}

export class SessionRequest extends PageRequest {
    public filter?: string;
    public is_bot_active?: string;
}
