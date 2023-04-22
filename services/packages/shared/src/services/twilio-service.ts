import { ChannelAttributes, ChannelMember } from '../types';
import { Twilio, jwt } from 'twilio';

import { ChannelInstance } from 'twilio/lib/rest/chat/v2/service/channel';
import { MemberInstance } from 'twilio/lib/rest/chat/v2/service/channel/member';
import { ResponseViewModel } from '../viewmodels/response-viewmodel';
import { ServiceContext } from 'twilio/lib/rest/chat/v2/service';
import { SuccessResponse } from '../viewmodels/response';
import { UserInstance } from 'twilio/lib/rest/chat/v2/service/user';
import { env } from '../helpers';
import { injectable } from 'inversify';

export interface TwilioServiceContract {
    sendMessage(
        channelSid: string,
        senderIdentifier: string,
        messageBody: unknown,
    ): Promise<ResponseViewModel<SuccessResponse>>;
    createUser(identity: string): Promise<ResponseViewModel<SuccessResponse>>;
    createChannel(channelAttributes: ChannelAttributes): Promise<ChannelInstance>;
    getChannel(uniqueName: string): Promise<ChannelInstance>;
    createMember(ChannelMember: ChannelMember): Promise<MemberInstance>;
    createAccessToken(identity: string): string;
}

@injectable()
export class TwilioService implements TwilioServiceContract {
    public init(): ServiceContext {
        const client = new Twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN, { edge: 'tokyo' });
        const service: ServiceContext = client.chat.services(env.TWILIO_SERVICE_ID);

        return service;
    }

    public async sendMessage(
        channelSid: string,
        senderIdentifier: string,
        messageBody: unknown,
    ): Promise<ResponseViewModel<SuccessResponse>> {
        await this.init()
            .channels(channelSid)
            .messages.create({ from: senderIdentifier, body: JSON.stringify(messageBody) });

        return ResponseViewModel.withSuccess();
    }

    public async getUser(identity: string): Promise<UserInstance> {
        try {
            const user = await this.init().users(identity).fetch();
            return user;
        } catch (error) {
            console.warn(`user doesn't exists, so create a new user`);
        }
    }

    public async createUser(identity: string): Promise<ResponseViewModel<SuccessResponse>> {
        const user = await this.getUser(identity);
        if (user) {
            return ResponseViewModel.withSuccess();
        }
        await this.init().users.create({ identity });

        return ResponseViewModel.withSuccess();
    }

    public async getChannel(uniqueName: string): Promise<ChannelInstance> {
        try {
            const channel = await this.init().channels(uniqueName).fetch();

            return channel;
        } catch (error) {
            console.warn(`Channel doesn't exist, so create a new channel`);
        }
    }

    public async createChannel(channelAttributes: ChannelAttributes): Promise<ChannelInstance> {
        const uniqueName = `${channelAttributes.productId}${channelAttributes.customerId}`;
        const channel = await this.init().channels.create({
            friendlyName: channelAttributes.customerEmail,
            uniqueName,
            attributes: JSON.stringify(channelAttributes),
            type: 'private',
        });

        return channel;
    }

    public async createMember(channelMember: ChannelMember): Promise<MemberInstance> {
        const { channelId, displayName, userId, role, tenantId } = channelMember;
        const attributes = JSON.stringify({ name: displayName, role });
        const member: MemberInstance = await this.init()
            .channels(channelId)
            .members.create({ identity: `${userId}-${tenantId}`, attributes });

        return member;
    }

    public createAccessToken(identity: string): string {
        const AccessToken = jwt.AccessToken;
        const ChatGrant = AccessToken.ChatGrant;

        // Used when generating any kind of tokens
        const twilioAccountSid = env.TWILIO_ACCOUNT_SID;
        const twilioApiKey = env.TWILIO_API_KEY;
        const twilioApiSecret = env.TWILIO_API_SECRET;

        // Used specifically for creating Chat tokens
        const serviceSid = env.TWILIO_SERVICE_ID;

        const chatGrant = new ChatGrant({
            serviceSid: serviceSid,
        });
        // Create an access token which we will sign and return to the client,
        // containing the grant we just created
        const token = new AccessToken(twilioAccountSid, twilioApiKey, twilioApiSecret, { identity: identity });
        token.addGrant(chatGrant);

        // Serialize the token to a JWT string
        const jwtToken = token.toJwt();

        return jwtToken;
    }
}
