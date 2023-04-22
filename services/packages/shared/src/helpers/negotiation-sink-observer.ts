import { eventSink } from '../factories';
import { Bootstrapper } from '../bootstrap/bootstrapper';
import { WebhookServiceContract } from '../services';
import { Constant } from './constant';

class NegotiationSinkObserver {
    public onOfferAccepted() {
        eventSink.addObserver(Constant.NegotiationEvents.onOfferAccepted, function (data) {
            const container = Bootstrapper.getContainer();
            const webhookService = container.get<WebhookServiceContract>('WebhookService');
            webhookService.onOfferAccepted(data[0]);
        });
    }

    public onAgentMadeOffer() {
        eventSink.addObserver(Constant.NegotiationEvents.onAgentMadeOffer, function (data) {
            const container = Bootstrapper.getContainer();
            const webhookService = container.get<WebhookServiceContract>('WebhookService');
            webhookService.onAgentMadeOffer(data[0]);
        });
    }

    public onOfferRejected() {
        eventSink.addObserver(Constant.NegotiationEvents.onOfferRejected, function (data) {
            const container = Bootstrapper.getContainer();
            const webhookService = container.get<WebhookServiceContract>('WebhookService');
            webhookService.onOfferRejected(data[0]);
        });
    }

    public onCustomerAcceptedOffer() {
        eventSink.addObserver(Constant.NegotiationEvents.onCustomerAcceptedOffer, function (data) {
            const container = Bootstrapper.getContainer();
            const webhookService = container.get<WebhookServiceContract>('WebhookService');
            webhookService.onCustomerAcceptedOffer(data[0]);
        });
    }

    public onCustomerRejectedOffer() {
        eventSink.addObserver(Constant.NegotiationEvents.onCustomerRejectedOffer, function (data) {
            const container = Bootstrapper.getContainer();
            const webhookService = container.get<WebhookServiceContract>('WebhookService');
            webhookService.onCustomerRejectedOffer(data[0]);
        });
    }

    public onCustomerStartedEnquiry() {
        eventSink.addObserver(Constant.NegotiationEvents.onCustomerStartedEnquiry, function (data) {
            const container = Bootstrapper.getContainer();
            const webhookService = container.get<WebhookServiceContract>('WebhookService');
            webhookService.onCustomerStartedEnquiry(data[0]);
        });
    }
}
const eventSinkObserver = new NegotiationSinkObserver();
const negotiationSinkOnOfferAccepted = eventSinkObserver.onOfferAccepted();
const negotiationSinkOnOfferRejected = eventSinkObserver.onOfferRejected();
const negotiationSinkOnCustomerAcceptedOffer = eventSinkObserver.onCustomerAcceptedOffer();
const negotiationSinkOnCustomerRejectedOffer = eventSinkObserver.onCustomerRejectedOffer();
const negotiationSinkOnCustomerStartedEnquiry = eventSinkObserver.onCustomerStartedEnquiry();
const negotiationSinkOnAgentMadeOffer = eventSinkObserver.onAgentMadeOffer();

export {
    negotiationSinkOnOfferAccepted,
    negotiationSinkOnCustomerAcceptedOffer,
    negotiationSinkOnOfferRejected,
    negotiationSinkOnCustomerRejectedOffer,
    negotiationSinkOnCustomerStartedEnquiry,
    negotiationSinkOnAgentMadeOffer,
};
