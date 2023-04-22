import { ChannelStatus } from '../../types/channel-status';
import { NegotiationResponse } from '../../types/parameter';
import { ResponseViewModel } from '../response-viewmodel';

export class EmbedAuthenticationResponse {
    public token: string;
    public type: string;
}

export class EmbedCustomerAuthenticationResponse {
    public token?: string;
    channels?: ChannelStatus[];
    session?: ResponseViewModel<NegotiationResponse>;
    totalItems?: number;
}
