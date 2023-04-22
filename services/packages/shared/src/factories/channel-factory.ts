import { Bootstrapper } from '../bootstrap/bootstrapper';
import { TwilioServiceContract } from '../services';

export class ChannelFactory {
    public static get(): TwilioServiceContract {
        const container = Bootstrapper.getContainer();
        const contract = container.get<TwilioServiceContract>('TwilioService');

        return contract;
    }
}
