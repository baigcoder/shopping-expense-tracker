export const AUTO_APPROVE_CONFIDENCE = 0.85;

// Extension captures go straight to the ledger once the page confirmed payment; set EXTENSION_REQUIRE_REVIEW=true to demand a merchant rule first.
export function shouldAutoApproveExtensionCapture(input: {
    source?: string;
    matchedRule?: { id?: string } | null;
    duplicate?: boolean;
    confidence?: number;
    amount?: number;
    isTrial?: boolean;
    fxUnavailable?: boolean;
}) {
    if (input.source !== 'extension') return false;
    if (process.env.EXTENSION_REQUIRE_REVIEW === 'true' && !input.matchedRule) return false;
    if (input.duplicate) return false;
    // An unconverted foreign amount would be booked in the wrong currency.
    if (input.fxUnavailable) return false;
    if ((input.confidence ?? 0) < AUTO_APPROVE_CONFIDENCE) return false;
    // Trials charge nothing today: they live in Subscriptions, not as a $0 ledger row.
    if ((Number(input.amount) || 0) <= 0) return false;
    return true;
}
