/**
 * CASHLY V11 — TRANSACTION LIFECYCLE & STATE MACHINE
 * Authority: /docs/backend-v11/05_TRANSACTION_STATE_MACHINE.md
 * Enforces legal state transitions and rejects illegal state mutations.
 */

export type TransactionLifecycleState =
    | 'CAPTURED'
    | 'PENDING_REVIEW'
    | 'RULE_APPLIED'
    | 'APPROVED'
    | 'REJECTED'
    | 'MERGED'
    | 'SPLIT';

export class IllegalStateTransitionError extends Error {
    constructor(
        public readonly fromState: TransactionLifecycleState,
        public readonly toState: TransactionLifecycleState,
        public readonly reason?: string
    ) {
        super(
            `Illegal transaction transition from '${fromState}' to '${toState}'${
                reason ? `: ${reason}` : ''
            }`
        );
        this.name = 'IllegalStateTransitionError';
    }
}

// Legal transition graph
const LEGAL_TRANSITIONS: Record<TransactionLifecycleState, ReadonlySet<TransactionLifecycleState>> = {
    CAPTURED: new Set(['PENDING_REVIEW', 'RULE_APPLIED', 'REJECTED']),
    PENDING_REVIEW: new Set(['APPROVED', 'REJECTED', 'MERGED', 'SPLIT', 'RULE_APPLIED']),
    RULE_APPLIED: new Set(['APPROVED', 'PENDING_REVIEW', 'REJECTED']),
    APPROVED: new Set([]), // Terminal for review inbox. Ledger mutations require compensating entries.
    REJECTED: new Set([]), // Terminal
    MERGED: new Set([]),   // Terminal
    SPLIT: new Set([]),    // Terminal
};

export class TransactionStateMachine {
    private state: TransactionLifecycleState;
    private readonly history: Array<{
        from: TransactionLifecycleState;
        to: TransactionLifecycleState;
        timestamp: string;
        actorId: string;
        reason?: string;
    }> = [];

    constructor(initialState: TransactionLifecycleState = 'CAPTURED') {
        this.state = initialState;
    }

    static canTransition(from: TransactionLifecycleState, to: TransactionLifecycleState): boolean {
        return LEGAL_TRANSITIONS[from]?.has(to) ?? false;
    }

    static validateTransition(from: TransactionLifecycleState, to: TransactionLifecycleState): void {
        if (!this.canTransition(from, to)) {
            throw new IllegalStateTransitionError(
                from,
                to,
                LEGAL_TRANSITIONS[from]?.size === 0
                    ? `State '${from}' is terminal and cannot be modified`
                    : `Allowed next states are: ${Array.from(LEGAL_TRANSITIONS[from] || []).join(', ')}`
            );
        }
    }

    getState(): TransactionLifecycleState {
        return this.state;
    }

    getHistory() {
        return [...this.history];
    }

    isTerminal(): boolean {
        return LEGAL_TRANSITIONS[this.state].size === 0;
    }

    canTransitionTo(targetState: TransactionLifecycleState): boolean {
        return LEGAL_TRANSITIONS[this.state].has(targetState);
    }

    transitionTo(
        targetState: TransactionLifecycleState,
        context: { actorId: string; reason?: string; timestamp?: string }
    ): void {
        if (!this.canTransitionTo(targetState)) {
            throw new IllegalStateTransitionError(
                this.state,
                targetState,
                this.isTerminal()
                    ? `State '${this.state}' is terminal and cannot be modified`
                    : `Allowed next states are: ${Array.from(LEGAL_TRANSITIONS[this.state]).join(', ')}`
            );
        }

        const transitionRecord = {
            from: this.state,
            to: targetState,
            timestamp: context.timestamp || new Date().toISOString(),
            actorId: context.actorId,
            reason: context.reason,
        };

        this.history.push(transitionRecord);
        this.state = targetState;
    }
}
