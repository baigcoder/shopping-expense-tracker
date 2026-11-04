// Is the browser extension installed here, and signed in to the same Cashly account as this website?
// The extension answers a live question over the page bridge (content-website.js, action STATUS); no answer means
// it is not installed or is a version too old to capture payments correctly.
import { supabase } from '@/config/supabase';

export interface ExtensionReply { installed?: boolean; loggedIn?: boolean; userId?: string | null; userEmail?: string | null; version?: string }
export type LinkState = 'checking' | 'missing' | 'signed-out' | 'other-account' | 'linked';

/** Same account means the same user id; the email is only a fallback for extensions that do not report an id. */
export function linkState(reply: ExtensionReply | null, me: { id?: string | null; email?: string | null }): LinkState {
    if (!reply?.installed) return 'missing';
    if (!reply.loggedIn) return 'signed-out';
    if (reply.userId && me.id) return reply.userId === me.id ? 'linked' : 'other-account';
    if (reply.userEmail && me.email) return reply.userEmail.trim().toLowerCase() === me.email.trim().toLowerCase() ? 'linked' : 'other-account';
    return 'other-account';
}

export function askExtension(timeoutMs = 2000): Promise<ExtensionReply | null> {
    return new Promise((resolve) => {
        const requestId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const done = (reply: ExtensionReply | null) => { window.removeEventListener('message', onMessage); window.clearTimeout(timer); resolve(reply); };
        const onMessage = (e: MessageEvent) => {
            if (e.source !== window || e.data?.source !== 'cashly-extension' || e.data?.type !== 'EXTENSION_STATUS' || e.data?.requestId !== requestId) return;
            done(e.data.data || null);
        };
        const timer = window.setTimeout(() => done(null), timeoutMs);
        window.addEventListener('message', onMessage);
        window.postMessage({ type: 'WEBSITE_TO_EXTENSION', action: 'STATUS', requestId }, window.location.origin);
    });
}

/** Signs the extension in as this website's user, the same message the website sends after every sign-in. */
export async function connectExtension(): Promise<boolean> {
    const { data } = await supabase.auth.getSession();
    const session = data.session;
    if (!session?.access_token || !session.user) return false;
    window.postMessage({ type: 'WEBSITE_TO_EXTENSION', action: 'SYNC_SESSION', data: { session, user: session.user, accessToken: session.access_token } }, window.location.origin);
    return true;
}
