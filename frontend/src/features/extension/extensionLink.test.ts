import { describe, expect, it, vi } from 'vitest';

vi.mock('@/config/supabase', () => ({ supabase: { auth: { getSession: vi.fn() } } }));

import { askExtension, linkState } from './extensionLink';

const me = { id: 'u1', email: 'Sana@cashly.app' };

describe('linkState', () => {
    it('needs the extension installed and signed in to this same account', () => {
        expect(linkState(null, me)).toBe('missing');
        expect(linkState({ installed: true, loggedIn: false }, me)).toBe('signed-out');
        expect(linkState({ installed: true, loggedIn: true, userId: 'u2', userEmail: 'sana@cashly.app' }, me)).toBe('other-account');
        expect(linkState({ installed: true, loggedIn: true, userId: 'u1' }, me)).toBe('linked');
    });

    it('falls back to the email, ignoring case, when an extension reports no user id', () => {
        expect(linkState({ installed: true, loggedIn: true, userEmail: ' sana@CASHLY.app ' }, me)).toBe('linked');
        expect(linkState({ installed: true, loggedIn: true, userEmail: 'other@cashly.app' }, me)).toBe('other-account');
    });
});

describe('askExtension', () => {
    it('treats silence as not installed', async () => {
        expect(await askExtension(30)).toBeNull();
    });

    it('takes the extension’s answer to its own question only', async () => {
        const post = vi.spyOn(window, 'postMessage');
        const answer = askExtension(500);
        const { requestId } = post.mock.calls[0][0] as { requestId: string };
        window.dispatchEvent(new MessageEvent('message', { source: window, data: { source: 'cashly-extension', type: 'EXTENSION_STATUS', requestId: 'someone-else', data: { installed: true, loggedIn: true, userId: 'x' } } }));
        window.dispatchEvent(new MessageEvent('message', { source: window, data: { source: 'cashly-extension', type: 'EXTENSION_STATUS', requestId, data: { installed: true, loggedIn: true, userId: 'u1' } } }));
        expect(await answer).toEqual({ installed: true, loggedIn: true, userId: 'u1' });
        post.mockRestore();
    });
});
