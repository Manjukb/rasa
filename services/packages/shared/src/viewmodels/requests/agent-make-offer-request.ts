import { Constant } from '../../helpers';
import { Offer } from '../../types';

export class AgentMakeOfferRequest {
    public session_id: string;
    public price: number;
    public quantity: number;
    public payload: any;

    public static offerObject(me: AgentMakeOfferRequest, userId: string): Offer {
        const offer = new Offer();
        offer.by = Constant.offerBy.agent;
        offer.user_Id = userId;
        offer.offer = {};
        offer.offer_score = {};
        offer.round = 0;
        offer.utility_score = `0`;
        const reqParams = Constant.requiredParams;
        Object.entries(me).forEach((data: [string, string]): void => {
            if (reqParams.includes(data[0])) {
                offer.offer[data[0]] = data[1];
                offer.offer_score[data[0]] = `0`;
            }
        });

        return offer;
    }
}
