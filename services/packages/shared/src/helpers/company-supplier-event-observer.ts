import { Bootstrapper } from '../bootstrap/bootstrapper';
import { Constant } from './constant';
import { SupplierWebhookServiceContract } from '../services';
import { eventSink } from '../factories';

class CompanySupplierEventObserver {
    public onSupplierOnBoarded() {
        eventSink.addObserver(Constant.SupplierImportEvents.onSupplierOnBoarded, function (data) {
            const container = Bootstrapper.getContainer();
            const webhookService = container.get<SupplierWebhookServiceContract>('SupplierWebhookService');
            webhookService.onSupplierOnBoarded(data[0]);
        });
    }
    public onNewClientHandShaken() {
        eventSink.addObserver(Constant.SupplierImportEvents.onNewClientHandShaken, function (data) {
            const container = Bootstrapper.getContainer();
            const webhookService = container.get<SupplierWebhookServiceContract>('SupplierWebhookService');
            webhookService.onNewClientHandShaken(data[0]);
        });
    }
}
const eventSinkObserver = new CompanySupplierEventObserver();
const SinkNewSupplierOnBoarded = eventSinkObserver.onSupplierOnBoarded();
const SinkNewClientHandShaken = eventSinkObserver.onNewClientHandShaken();

export { SinkNewSupplierOnBoarded, SinkNewClientHandShaken };
