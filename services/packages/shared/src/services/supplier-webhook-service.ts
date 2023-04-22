import { injectable, inject } from 'inversify';
import { CompanySupplierHandShakingEvent, SupplierWebhooksEvent } from '../types';
import { MailServiceContract } from './mail-service';

export interface SupplierWebhookServiceContract {
    onSupplierOnBoarded(data: SupplierWebhooksEvent): void;
    onNewClientHandShaken(data: CompanySupplierHandShakingEvent): void;
}
@injectable()
export class SupplierWebhookService implements SupplierWebhookServiceContract {
    constructor(@inject('MailService') private readonly mailService: MailServiceContract) {}

    public async onSupplierOnBoarded(webhooksEvent: SupplierWebhooksEvent): Promise<void> {
        await this.mailService.sendWelcomeSupplier(webhooksEvent);
    }

    public async onNewClientHandShaken(webhooksEvent: CompanySupplierHandShakingEvent): Promise<void> {
        await this.mailService.sendWelCompanySupplierHandshakingMail(webhooksEvent);
    }
}
