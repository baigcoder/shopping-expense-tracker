import { describe, expect, it } from 'vitest';
import {
    IllegalStateTransitionError,
    TransactionStateMachine,
} from '../transactionStateMachine.js';

describe('Transaction State Machine (INV-10)', () => {
    it('initializes in CAPTURED state by default', () => {
        const sm = new TransactionStateMachine();
        expect(sm.getState()).toBe('CAPTURED');
        expect(sm.isTerminal()).toBe(false);
    });

    it('allows legal path: CAPTURED -> PENDING_REVIEW -> APPROVED', () => {
        const sm = new TransactionStateMachine();
        sm.transitionTo('PENDING_REVIEW', { actorId: 'system', reason: 'staged for user triage' });
        expect(sm.getState()).toBe('PENDING_REVIEW');

        sm.transitionTo('APPROVED', { actorId: 'user-1', reason: 'user approved in inbox' });
        expect(sm.getState()).toBe('APPROVED');
        expect(sm.isTerminal()).toBe(true);

        const history = sm.getHistory();
        expect(history).toHaveLength(2);
        expect(history[0].from).toBe('CAPTURED');
        expect(history[0].to).toBe('PENDING_REVIEW');
        expect(history[1].from).toBe('PENDING_REVIEW');
        expect(history[1].to).toBe('APPROVED');
    });

    it('rejects illegal transition from APPROVED to PENDING_REVIEW', () => {
        const sm = new TransactionStateMachine('APPROVED');
        expect(() => {
            sm.transitionTo('PENDING_REVIEW', { actorId: 'user-1' });
        }).toThrow(IllegalStateTransitionError);
    });

    it('allows branching paths: PENDING_REVIEW -> REJECTED, MERGED, SPLIT', () => {
        const rejectSm = new TransactionStateMachine('PENDING_REVIEW');
        rejectSm.transitionTo('REJECTED', { actorId: 'user-1', reason: 'spam detection' });
        expect(rejectSm.getState()).toBe('REJECTED');
        expect(rejectSm.isTerminal()).toBe(true);

        const mergeSm = new TransactionStateMachine('PENDING_REVIEW');
        mergeSm.transitionTo('MERGED', { actorId: 'user-1', reason: 'duplicate statement item' });
        expect(mergeSm.getState()).toBe('MERGED');

        const splitSm = new TransactionStateMachine('PENDING_REVIEW');
        splitSm.transitionTo('SPLIT', { actorId: 'user-1', reason: 'business split' });
        expect(splitSm.getState()).toBe('SPLIT');
    });

    it('allows rule application: CAPTURED -> RULE_APPLIED -> APPROVED', () => {
        const sm = new TransactionStateMachine('CAPTURED');
        sm.transitionTo('RULE_APPLIED', { actorId: 'rule-engine', reason: 'Amazon 100% match' });
        expect(sm.getState()).toBe('RULE_APPLIED');

        sm.transitionTo('APPROVED', { actorId: 'auto-approver' });
        expect(sm.getState()).toBe('APPROVED');
    });

    it('rejects random non-legal transitions (e.g. CAPTURED -> MERGED)', () => {
        const sm = new TransactionStateMachine('CAPTURED');
        expect(() => {
            sm.transitionTo('MERGED', { actorId: 'user-1' });
        }).toThrow(IllegalStateTransitionError);
    });
});
