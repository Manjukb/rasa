import { HandshakeRequest, CustomerHandshakeRequest } from '../viewmodels/requests';
import { ResponseViewModel } from '../viewmodels/response-viewmodel';
import { EmbedAuthenticationResponse } from '../viewmodels/response';
import { injectable, inject } from 'inversify';
import { ApiKeyServiceContract } from './';
import { HandshakeFactory } from '../factories';

export interface EmbedServiceContract {
    handshake(handshakeRequest: HandshakeRequest): Promise<ResponseViewModel<EmbedAuthenticationResponse>>;
}

@injectable()
export class EmbedService implements EmbedServiceContract {
    public constructor(@inject('ApiKeyService') private readonly apiKeyService: ApiKeyServiceContract) {}

    public async handshake(
        handshakeRequest: HandshakeRequest,
    ): Promise<ResponseViewModel<EmbedAuthenticationResponse>> {
        const apiKey = (await this.apiKeyService.getDetailByAPIKey(handshakeRequest.api_key)).data;
        const organisation = apiKey.organisation;
        handshakeRequest.organisation = organisation;
        const service = HandshakeFactory.get(handshakeRequest);
        return await service.getEmbedToken(handshakeRequest as CustomerHandshakeRequest);
    }
}
