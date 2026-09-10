import { describe, expect, it } from 'vitest';
import { buildPaymentCaptureTrail, formatBehaviorFlow, formatCaptureState } from '../paymentCaptureTrail';

describe('paymentCaptureTrail', () => {
    it('builds a queued trail from an inbox candidate', () => {
        const trail = buildPaymentCaptureTrail({
            candidate: {
                merchant_name: 'Amazon',
                amount: 42.5,
                behaviorFlow: [
                    { from: 'idle', to: 'checkout_entered', at: 1 },
                    { from: 'checkout_entered', to: 'transaction_confirmed', at: 2 },
                ],
            },
            pendingReview: true,
        }, 'transaction-candidate-added');

        expect(trail).toMatchObject({
            merchant: 'Amazon',
            amount: 42.5,
            state: 'queued',
            pendingReview: true,
        });
        expect(formatBehaviorFlow(trail!.behaviorFlow)).toContain('checkout entered');
        expect(formatCaptureState(trail!.state)).toBe('Queued');
    });

    it('keeps checkout progress without treating browsing as a capture', () => {
        const previous = buildPaymentCaptureTrail({
            siteName: 'Shopify',
            state: 'payment_submitted',
            amount: 18,
        }, 'site-visit-tracked');

        const browsing = buildPaymentCaptureTrail({
            siteName: 'News Site',
            state: 'monitoring',
        }, 'site-visit-tracked', previous);

        expect(previous?.state).toBe('payment_submitted');
        expect(browsing?.merchant).toBe('Shopify');
        expect(browsing?.state).toBe('payment_submitted');
    });

    it('ignores generic browsing wrapped in cashly-data-updated', () => {
        const previous = buildPaymentCaptureTrail({
            siteName: 'Amazon',
            state: 'payment_form_active',
            amount: 12,
        }, 'payment-capture-trail');
        const wrapped = buildPaymentCaptureTrail({
            type: 'SITE_VISIT_TRACKED',
            siteName: 'Blog',
            state: 'monitoring',
        }, 'cashly-data-updated', previous);
        expect(wrapped?.merchant).toBe('Amazon');
        expect(wrapped?.state).toBe('payment_form_active');
    });
});
