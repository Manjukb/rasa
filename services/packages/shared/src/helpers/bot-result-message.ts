import { Util } from './util';

type BotResultMessagesType = {
    firstRound: string[];
    intermediateRound: string[];
    finalRound: string[];
};
const BotResultMessages: BotResultMessagesType = {
    firstRound: [
        `Hmmm...that's a bit low. How about this?`,
        `Thanks, however I am afraid this is bit low. Can you please consider this offer?`,
        `Appreciate your offer! But will you accept this offer ?`,
    ],
    intermediateRound: [
        `I am afraid your offer is still on the lower side. Let me improve my offer.`,
        `We seem to be closing in on a deal. How about this?`,
        `We are keen to make this deal happen. How about this offer?`,
        `We are close to striking a deal. How about this?`,
        `Thanks for your patience. Does this offer work for you?`,
        `We are so close to an agreement. Let me make you an improved offer:`,
    ],
    finalRound: [
        `I really hope we can agree on this. Here's my final offer:`,
        `Hope we can do business today! Here is my best offer:`,
        `We have really done our best. I can't go below this offer:`,
    ],
};

export class BotResultMessage {
    public static getBotResultMessage(currentRound: number, totalRounds: number): string {
        if (currentRound === 1 && totalRounds !== 1) {
            return Util.shuffle(BotResultMessages.firstRound)[0];
        }
        // if (currentRound === 1 && totalRounds === 1) {
        //     return Util.shuffle(BotResultMessages.finalRound)[0];
        // }
        if (currentRound > 1 && currentRound !== totalRounds) {
            return Util.shuffle(BotResultMessages.intermediateRound)[0];
        }
        return Util.shuffle(BotResultMessages.finalRound)[0];
    }

    public static readonly NegotiationMessage = {
        won:
            'Congratulations! , We are pleased to inform you that we have decided to award your firm this contract for supplying us the items specified in the RFQ.',
        lost:
            'I am afraid your bid for this RFQ was not successful. We thank you for your proactive and active participation in the process, and hope to engage with you soon for our procurement needs again soon.',
        rfqDeadline:
            'Please note that the deadline for you to provide your response to our ongoing RFQ negotiation is {{RFQ_next_round_deadline}}. We will not accept any quotes that we receive in the system after that.',
        rfqReject: 'Sorry, we could not arrive at a deal this time. Hope we can work together in the future.',
    };
}
