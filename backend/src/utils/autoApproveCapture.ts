export const AUTO_APPROVE_CONFIDENCE = 0.85;

export function shouldAutoApproveExtensionCapture(input: {
    source?: string;
    matchedRule?: { id?: string } | null;
    duplicate?: boolean;
    confidence?: number;
    amount?: number;
    isTrial?: boolean;
}) {
    if (input.source !== 'extension') return false;
    if (!input.matchedRule) return false;
    if (input.duplicate) return false;
    if ((input.confidence ?? 0) < AUTO_APPROVE_CONFIDENCE) return false;
    const amount = Number(input.amount) || 0;
    if (amount <= 0 && !input.isTrial) return false;
    return true;
}
