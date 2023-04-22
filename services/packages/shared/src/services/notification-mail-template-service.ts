import {
    EmailTemplate,
    EmailTemplateResponse,
    RfqResponse,
    OrganisationServiceContract,
    CategoryServiceContract,
    SupplierServiceContract,
    ResponseViewModel,
    User,
    MailServiceContract,
} from '..';
import { env } from '..';
import { getRepository } from 'typeorm';
import { injectable, inject } from 'inversify';
import { RequestUserResponse } from '../viewmodels/response';

export interface NotificationMailTemplateServiceContract {
    getEmailTemplateResponse(type: string, orgId: string): Promise<EmailTemplate>;
    checkEmailTemplateAndRfq(
        template: EmailTemplate,
        rfqData: RfqResponse,
    ): Promise<ResponseViewModel<EmailTemplateResponse>>;
    replaceTemplateParameter(
        template: EmailTemplate,
        rfqData: RfqResponse,
        deadline?: Date,
        supplier?: User[],
        rfqProcurementManager?: RequestUserResponse,
        round?: number,
        coPilotDeadline?: Date,
        coPilotTotal?: string,
        botTotal?: string,
    ): Promise<EmailTemplateResponse>;
}

@injectable()
export class NotificationMailTemplateService implements NotificationMailTemplateServiceContract {
    public constructor(
        @inject('OrganisationService') private readonly organisationService: OrganisationServiceContract,
        @inject('CategoryService') private readonly categoryService: CategoryServiceContract,
        @inject('SupplierService') private readonly supplierService: SupplierServiceContract,
        @inject('OrganisationService') private readonly orgService: OrganisationServiceContract,
        @inject('MailService') private readonly mailService: MailServiceContract,
    ) {}

    public async getEmailTemplateResponse(type: string, orgId: string): Promise<EmailTemplate> {
        let template = await getRepository(EmailTemplate).findOne({
            organisation_id: orgId,
            template_type: type,
        });
        if (!template) {
            template = await getRepository(EmailTemplate).findOne({
                template_type: type,
                organisation_id: null,
            });
        }
        return template;
    }

    public async checkEmailTemplateAndRfq(
        template: EmailTemplate,
        rfqData: RfqResponse,
    ): Promise<ResponseViewModel<EmailTemplateResponse>> {
        if (!template) {
            return ResponseViewModel.withError('No template stored with passed template type & organisation-id');
        }
        if (!rfqData) {
            return ResponseViewModel.withError('invalid rfq-id');
        }
        return new ResponseViewModel();
    }

    public async replaceTemplateParameter(
        template: EmailTemplate,
        rfqData: RfqResponse,
        deadline?: Date,
        supplier?: User[],
        rfqProcurementManager?: RequestUserResponse,
        round?: number,
        coPilotDeadline?: Date,
        coPilotTotal?: string,
        botTotal?: string,
    ): Promise<EmailTemplateResponse> {
        const timeZone = await this.orgService.getOrganisationTimeZone(rfqData.organisation_id);

        const rfqDeadlines = (rfqData.negotiation_process || {}).deadlines;
        const categoryId = rfqData.categories && rfqData.categories.map((category) => category.id).toString();
        const rfqCategory = (await this.categoryService.getById(categoryId)).data;
        const rfqOrganisation = (await this.organisationService.getById(rfqData.organisation_id)).data;
        const supplierOrganisation =
            supplier && (await this.supplierService.getLightweightBySupplierIds([supplier[0].supplier_id]));
        const now = new Date();
        const dateAfterTomorrow = this.mailService
            .toTimeZone(new Date(now.setDate(now.getDate() + 2)), timeZone)
            .toString()
            .toLocaleString();

        const emailTemplate = new EmailTemplateResponse();

        emailTemplate.subject = template.subject.replace('{{rfq_number}}', rfqData.rfq_number.toString());
        if (emailTemplate.subject.includes('{{rfq_close_date}}')) {
            emailTemplate.subject = emailTemplate.subject.replace(
                '{{rfq_close_date}}',
                this.mailService.toTimeZone(new Date(), timeZone).toString().toLocaleString(),
            );
        }
        emailTemplate.subject = deadline
            ? emailTemplate.subject.replace(
                  '{{rfq_date}}',
                  this.mailService.toTimeZone(new Date(deadline), timeZone).toString().toLocaleString(),
              )
            : emailTemplate.subject.replace(
                  '{{rfq_date}}',
                  this.mailService.toTimeZone(new Date(rfqDeadlines[0]), timeZone).toString().toLocaleString(),
              );
        if (supplier)
            template.message = template.message
                .replace('{{supplier_name}}', supplier[0].name)
                .replace('{{supplier_organisation}}', supplierOrganisation[0].name)
                .replace('{{negotiation_round_no}}', String(round));
        if (rfqProcurementManager)
            template.message = template.message
                .replace('{{procurement_manager}}', rfqProcurementManager.name)
                .replace('{{negotiation_round_no}}', String(round));
        if (coPilotDeadline) {
            emailTemplate.subject = emailTemplate.subject.replace(
                '{{co_pilot_deadline}}',
                this.mailService.toTimeZone(new Date(coPilotDeadline), timeZone).toString().toLocaleString(),
            );
            template.message = template.message.replace(
                '{{co_pilot_deadline}}',
                this.mailService.toTimeZone(new Date(coPilotDeadline), timeZone).toString().toLocaleString(),
            );
        }
        if (coPilotTotal) {
            template.message = template.message.replace('{{co_pilot_offer}}', coPilotTotal);
        }
        if (botTotal) {
            template.message = template.message.replace('"Bot Offer"', botTotal);
        }
        template.message = deadline
            ? template.message.replace(
                  '{{rfq_date}}',
                  this.mailService.toTimeZone(new Date(deadline), timeZone).toString().toLocaleString(),
              )
            : template.message.replace(
                  '{{rfq_date}}',
                  this.mailService
                      .toTimeZone(new Date(rfqDeadlines[0].toString()), timeZone)
                      .toString()
                      .toLocaleString(),
              );
        template.message = template.message
            .replace(/{{rfq_number}}/gi, rfqData.rfq_number.toString())
            .replace('{{categories}}', rfqCategory && rfqCategory.name)
            .replace(
                '{{rfq_end_date}}',
                this.mailService
                    .toTimeZone(new Date(rfqDeadlines[rfqDeadlines.length - 1].toString()), timeZone)
                    .toString()
                    .toLocaleString(),
            )
            .replace(
                '{{supplier_offer_submit_date}}',
                this.mailService.toTimeZone(new Date(), timeZone).toLocaleString(),
            )
            .replace(
                '{{supplier_acceptance_deadline_date}}',
                this.mailService.toTimeZone(new Date(dateAfterTomorrow), timeZone).toString().toLocaleString(),
            )
            .replace('{{rfq_link}}', `${env.PUBLIC_URL}/negotiation?rfq_id=${rfqData.id}`)
            .replace('{{rfq_award_won_link}}', `${env.PUBLIC_URL}/negotiation?rfq_id=${rfqData.id}`)
            .replace(
                '{{link_to_get_feedback_from_the_losing_rfq_supplier}}',
                `${env.PUBLIC_URL}/negotiation?rfq_id=${rfqData.id}`,
            )
            .replace(
                '{{link_to_rfq_negotiation_detail_table}}',
                `${env.PUBLIC_URL}/rfq-manager/view-rfq/?rfq_id=${rfqData.id}&status=${rfqData.status}`,
            )
            .replace('{{organisation_name}}', rfqOrganisation.name)
            .replace('{{current_year}}', new Date().getFullYear().toString());

        emailTemplate.message = template.message;

        return emailTemplate;
    }
}
