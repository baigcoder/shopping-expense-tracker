// Free, keyless rates; cached per base currency so a busy checkout day costs one request.
const TTL_MS = 12 * 60 * 60 * 1000;
const cache = new Map<string, { at: number; rates: Record<string, number> }>();

export async function getFxRate(from: string, to: string): Promise<number | null> {
    const base = from.toUpperCase();
    const target = to.toUpperCase();
    if (base === target) return 1;

    const hit = cache.get(base);
    if (hit && Date.now() - hit.at < TTL_MS) return hit.rates[target] ?? null;

    try {
        const response = await fetch(`https://open.er-api.com/v6/latest/${base}`, { signal: AbortSignal.timeout(3000) });
        if (!response.ok) return hit?.rates[target] ?? null;
        const body = await response.json() as { result?: string; rates?: Record<string, number> };
        if (body.result !== 'success' || !body.rates) return hit?.rates[target] ?? null;
        cache.set(base, { at: Date.now(), rates: body.rates });
        return body.rates[target] ?? null;
    } catch {
        return hit?.rates[target] ?? null;
    }
}
