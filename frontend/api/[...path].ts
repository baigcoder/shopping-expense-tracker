const hopByHopHeaders = new Set([
    'connection',
    'content-encoding',
    'content-length',
    'keep-alive',
    'proxy-authenticate',
    'proxy-authorization',
    'te',
    'trailer',
    'transfer-encoding',
    'upgrade',
]);

const isAbsoluteHttpUrl = (value?: string) => !!value && /^https?:\/\//i.test(value);

const getBackendApiUrl = () => {
    const raw = [
        process.env.BACKEND_API_URL,
        process.env.VITE_API_URL,
    ].find(isAbsoluteHttpUrl);

    if (!raw) {
        throw new Error('BACKEND_API_URL must be set to an absolute API URL');
    }

    return raw.replace(/\/+$/, '').replace(/\/api$/, '');
};

const toPath = (value: string | string[] | undefined) => {
    if (Array.isArray(value)) return value.join('/');
    return value || '';
};

export default async function handler(req: any, res: any) {
    const path = toPath(req.query.path);

    let target: URL | null = null;

    try {
        const targetUrl = new URL(`/api/${path}`, getBackendApiUrl());
        target = targetUrl;

        Object.entries(req.query || {}).forEach(([key, value]) => {
            if (key === 'path') return;
            if (Array.isArray(value)) {
                value.forEach((entry) => targetUrl.searchParams.append(key, String(entry)));
                return;
            }
            if (value !== undefined) targetUrl.searchParams.set(key, String(value));
        });

        const headers = new Headers();
        Object.entries(req.headers || {}).forEach(([key, value]) => {
            const lowerKey = key.toLowerCase();
            if (hopByHopHeaders.has(lowerKey) || lowerKey === 'host') return;
            if (Array.isArray(value)) {
                headers.set(key, value.join(', '));
                return;
            }
            if (value !== undefined) headers.set(key, String(value));
        });

        const method = req.method || 'GET';
        const hasBody = !['GET', 'HEAD'].includes(method);
        const body = hasBody
            ? typeof req.body === 'string' || Buffer.isBuffer(req.body)
                ? req.body
                : JSON.stringify(req.body ?? {})
            : undefined;

        const upstream = await fetch(targetUrl, {
            method,
            headers,
            body,
            redirect: 'manual',
        });

        upstream.headers.forEach((value, key) => {
            if (!hopByHopHeaders.has(key.toLowerCase())) {
                res.setHeader(key, value);
            }
        });

        const arrayBuffer = await upstream.arrayBuffer();
        res.status(upstream.status).send(Buffer.from(arrayBuffer));
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Backend proxy request failed';
        res.status(502).json({
            success: false,
            error: message,
            target: target ? target.origin : null,
        });
    }
}
