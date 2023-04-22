export class CompanyResponse {
    public id: string;
    public is_active: boolean;
    public organisation_id: string;
    public tenant_id?: string;
    public product_code: string;
    public created_date: Date;
    public updated_date: Date;
    public has_payment_terms: boolean;
}
