import { useCallback, useEffect, useState } from 'react';
import { Download, RefreshCw } from 'lucide-react';
import { CashlyLogo } from '@/components/brand/CashlyLogo';
import { askExtension, connectExtension, linkState, type LinkState } from './extensionLink';

// Phones and tablets cannot run browser extensions, so the gate would only lock people out there.
const canRunExtensions = () => typeof navigator !== 'undefined' && !/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

/** Live link state, rechecked every 15 seconds until linked, then every minute so an uninstall or sign-out shows the gate again. */
export function useExtensionLink(me: { id?: string | null; email?: string | null }) {
    const [state, setState] = useState<LinkState>('checking');
    const [extensionEmail, setExtensionEmail] = useState<string | null>(null);
    const check = useCallback(async () => {
        const reply = await askExtension();
        setExtensionEmail(reply?.userEmail || null);
        setState(linkState(reply, me));
    }, [me.id, me.email]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (!canRunExtensions()) { setState('linked'); return; }
        void check();
        const id = window.setInterval(() => void check(), state === 'linked' ? 60000 : 15000);
        const onFocus = () => void check();
        window.addEventListener('focus', onFocus);
        return () => { window.clearInterval(id); window.removeEventListener('focus', onFocus); };
    }, [check, state === 'linked']); // eslint-disable-line react-hooks/exhaustive-deps

    return { state, extensionEmail, check };
}

const STEPS = ['Download the extension and unzip it.', 'Open chrome://extensions and turn on Developer mode.', 'Choose Load unpacked and pick the unzipped folder.'];

export function ExtensionRequired({ state, email, extensionEmail, onCheck, onSignOut }: {
    state: Exclude<LinkState, 'linked'>; email?: string | null; extensionEmail: string | null; onCheck: () => Promise<void>; onSignOut: () => void;
}) {
    const [busy, setBusy] = useState(false);
    const run = async (work: () => Promise<unknown>) => { setBusy(true); try { await work(); await new Promise((r) => setTimeout(r, 600)); await onCheck(); } finally { setBusy(false); } };
    const connect = () => run(connectExtension);

    const copy: Record<Exclude<LinkState, 'linked'>, { title: string; body: string }> = {
        checking: { title: 'Looking for the extension', body: 'One moment.' },
        missing: { title: 'Install the Cashly extension', body: 'Cashly finds your purchases at checkout through the browser extension, so the dashboard opens once it is installed in this browser.' },
        'signed-out': { title: 'Connect the extension', body: `The extension is installed but not signed in. Connect it to ${email || 'your account'} so purchases land here.` },
        'other-account': { title: 'The extension uses another account', body: `It is signed in as ${extensionEmail || 'someone else'}, so purchases would go there. Switch it to ${email || 'this account'}.` },
    };
    const c = copy[state];

    return (
        <main className="flex min-h-screen items-center justify-center bg-[var(--color-canvas)] px-4 py-10">
            <section className="w-full max-w-[520px] rounded-[24px] bg-[var(--color-surface)] p-6 sm:p-8" aria-live="polite">
                <CashlyLogo />
                <h1 className="mt-8 font-display text-[28px] font-bold leading-tight tracking-tight">{c.title}</h1>
                <p className="mt-3 text-[16px] leading-relaxed text-[var(--color-ink-secondary)]">{c.body}</p>

                {state === 'missing' && (
                    <>
                        <ol className="mt-6 flex flex-col gap-3">
                            {STEPS.map((t, i) => (
                                <li key={t} className="flex gap-3 text-[15px] leading-relaxed">
                                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-canvas)] text-[13px] font-semibold tabular-nums">{i + 1}</span>{t}
                                </li>
                            ))}
                        </ol>
                        <div className="mt-6 flex flex-wrap gap-2">
                            <a href="/cashly-extension.zip" download className="inline-flex h-11 items-center gap-2 rounded-full bg-[var(--color-brand)] px-5 text-[15px] font-semibold text-[var(--color-on-brand)] hover:bg-[var(--color-brand-hover)]">
                                <Download size={16} aria-hidden /> Download the extension
                            </a>
                            <button type="button" onClick={() => run(async () => undefined)} disabled={busy} className="inline-flex h-11 items-center gap-2 rounded-full bg-[var(--color-canvas)] px-5 text-[15px] font-semibold hover:bg-[var(--color-surface-2)] disabled:opacity-50">
                                <RefreshCw size={15} className={busy ? 'animate-spin' : ''} aria-hidden /> I have installed it
                            </button>
                        </div>
                    </>
                )}

                {(state === 'signed-out' || state === 'other-account') && (
                    <button type="button" onClick={connect} disabled={busy} className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-[var(--color-brand)] px-5 text-[15px] font-semibold text-[var(--color-on-brand)] hover:bg-[var(--color-brand-hover)] disabled:opacity-50">
                        {busy ? 'Connecting…' : state === 'other-account' ? `Switch it to ${email || 'this account'}` : 'Connect the extension'}
                    </button>
                )}

                <p className="mt-8 text-[14px] text-[var(--color-muted)]">
                    Signed in as {email || 'you'} · <button type="button" onClick={onSignOut} className="underline underline-offset-4 hover:text-[var(--color-ink)]">Sign out</button>
                </p>
            </section>
        </main>
    );
}
