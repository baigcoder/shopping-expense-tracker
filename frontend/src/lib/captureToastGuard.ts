const claimed = new Map<string, number>();

export const claimCaptureToast = (key: string, ttlMs = 8000) => {
    const now = Date.now();
    const last = claimed.get(key) || 0;
    if (now - last < ttlMs) return false;
    claimed.set(key, now);
    return true;
};
