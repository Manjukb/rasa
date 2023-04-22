export enum SessionStatus {
    agent_reject = 'agent_reject',
    agent_fix_offer = 'agent_fix_offer',
    customer_negotiate = 'customer_negotiate',
    customer_reject = 'customer_reject',
    agent_accept = 'agent_accept',
    customer_accept = 'customer_accept',

    open = 'open',
    abandoned = 'abandoned',
    in_progress = 'in_progress',
    customer_accepted = 'customer_accepted',
    customer_rejected = 'customer_rejected',
    agent_offered = 'agent_offered',
    rejected = 'rejected',
    completed = 'completed',
    closed = 'closed',
    init = 'init',
}
