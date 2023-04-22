export class EmailTemplateResponse {
    id: string;
    organisation_id: string;
    to?: string;
    template_type: string;
    subject: string;
    message: string;
}
