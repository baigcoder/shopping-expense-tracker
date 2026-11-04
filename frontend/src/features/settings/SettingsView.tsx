import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

export interface SettingsPrefs {
    currency: string; theme: 'light' | 'dark'; soundEnabled: boolean; reducedMotion: boolean;
    emailNotifications: boolean; weeklyReport: boolean;
    aiLiveEnabled: boolean; aiMemoryEnabled: boolean; aiIncludePendingCandidates: boolean;
}
export type PurgeCategory = 'transactions' | 'budgets' | 'subscriptions' | 'goals';

interface SettingsViewProps {
    name: string; email: string; prefs: SettingsPrefs; currencies: { code: string; name: string }[];
    onSaveName: (name: string) => Promise<void>;
    onPref: (updates: Partial<SettingsPrefs>) => void;
    onAI: (updates: Partial<SettingsPrefs>) => void;
    onClearChat: () => Promise<void>;
    onPasswordReset: () => void;
    onSignOut: () => void;
    /** Resolve true when the step worked, so the form can move on. */
    onRequestCode: (category: PurgeCategory) => Promise<boolean>;
    onConfirmDelete: (code: string) => Promise<boolean>;
}

const field = 'h-10 rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[15px]';
const pill = 'inline-flex h-10 items-center rounded-full px-4 text-[14px] font-semibold disabled:opacity-50';
const switchInk = 'shadow-none data-[state=checked]:border-[var(--color-ink)] data-[state=checked]:bg-[var(--color-ink)]';

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
    return (
        <section className="rounded-[20px] bg-[var(--color-surface)] p-5 sm:p-6" aria-labelledby={`${id}-h`} data-tour={`settings-${id}`}>
            <h2 id={`${id}-h`} className="mb-2 font-display text-[17px] font-semibold">{title}</h2>
            <div className="divide-y divide-[var(--color-surface-2)]">{children}</div>
        </section>
    );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
    return (
        <label className="flex min-h-[52px] cursor-pointer items-center justify-between gap-4 py-2 text-[15px]">
            {label}
            <Switch checked={checked} onCheckedChange={onChange} className={switchInk} />
        </label>
    );
}

export function SettingsView({ name, email, prefs, currencies, onSaveName, onPref, onAI, onClearChat, onPasswordReset, onSignOut, onRequestCode, onConfirmDelete }: SettingsViewProps) {
    const [draft, setDraft] = useState(name);
    const [busy, setBusy] = useState<string | null>(null);
    const [category, setCategory] = useState<PurgeCategory>('transactions');
    const [typed, setTyped] = useState('');
    const [code, setCode] = useState('');
    const [codeSent, setCodeSent] = useState(false);

    const run = async (key: string, work: () => Promise<unknown>) => { setBusy(key); try { await work(); } finally { setBusy(null); } };

    return (
        <div className="flex max-w-[760px] flex-col gap-4">
            <header className="pb-2">
                <h1 className="font-display text-[28px] font-bold tracking-tight sm:text-[32px]">Settings</h1>
            </header>

            <Section id="profile" title="Profile">
                <form className="flex flex-wrap items-end gap-3 py-3" onSubmit={(e) => { e.preventDefault(); if (draft.trim()) void run('name', () => onSaveName(draft.trim())); }}>
                    <label className="flex min-w-0 flex-1 flex-col gap-1.5 text-[13px] font-medium">Name
                        <input value={draft} onChange={(e) => setDraft(e.target.value)} className={field} autoComplete="name" />
                    </label>
                    <button type="submit" disabled={busy === 'name' || draft.trim() === name || !draft.trim()} className={cn(pill, 'bg-[var(--color-ink)] text-white')}>
                        {busy === 'name' ? 'Saving' : 'Save'}
                    </button>
                </form>
                <p className="flex min-h-[52px] items-center justify-between gap-4 py-2 text-[15px]">Email<span className="truncate text-[var(--color-ink-secondary)]">{email}</span></p>
            </Section>

            <Section id="app" title="App">
                <label className="flex min-h-[52px] items-center justify-between gap-4 py-2 text-[15px]">Currency
                    <select value={prefs.currency} onChange={(e) => onPref({ currency: e.target.value })} className={cn(field, 'max-w-[220px] px-2')}>
                        {currencies.map((c) => <option key={c.code} value={c.code}>{c.code} · {c.name}</option>)}
                    </select>
                </label>
                <Toggle label="Dark mode" checked={prefs.theme === 'dark'} onChange={(v) => onPref({ theme: v ? 'dark' : 'light' })} />
                <Toggle label="Sounds" checked={prefs.soundEnabled} onChange={(v) => onPref({ soundEnabled: v })} />
                <Toggle label="Less motion" checked={prefs.reducedMotion} onChange={(v) => onPref({ reducedMotion: v })} />
                <Toggle label="Email me about new purchases" checked={prefs.emailNotifications} onChange={(v) => onPref({ emailNotifications: v })} />
                <Toggle label="Weekly summary email" checked={prefs.weeklyReport} onChange={(v) => onPref({ weeklyReport: v })} />
            </Section>

            <Section id="ai" title="Ask Cashly">
                <Toggle label="Use live AI answers" checked={prefs.aiLiveEnabled} onChange={(v) => onAI({ aiLiveEnabled: v })} />
                <Toggle label="Remember past conversations" checked={prefs.aiMemoryEnabled} onChange={(v) => onAI({ aiMemoryEnabled: v })} />
                <Toggle label="Include purchases still waiting for approval" checked={prefs.aiIncludePendingCandidates} onChange={(v) => onAI({ aiIncludePendingCandidates: v })} />
                <div className="flex min-h-[52px] items-center justify-between gap-4 py-2 text-[15px]">Conversation history
                    <button type="button" onClick={() => run('chat', onClearChat)} disabled={busy === 'chat'} className={cn(pill, 'bg-[var(--color-canvas)] hover:bg-[var(--color-surface-2)]')}>
                        {busy === 'chat' ? 'Clearing' : 'Clear'}
                    </button>
                </div>
            </Section>

            <Section id="security" title="Sign-in">
                <div className="flex min-h-[52px] items-center justify-between gap-4 py-2 text-[15px]">Password
                    <button type="button" onClick={onPasswordReset} className={cn(pill, 'bg-[var(--color-canvas)] hover:bg-[var(--color-surface-2)]')}>Email me a reset link</button>
                </div>
                <div className="flex min-h-[52px] items-center justify-between gap-4 py-2 text-[15px]">This device
                    <button type="button" onClick={onSignOut} className={cn(pill, 'bg-[var(--color-canvas)] hover:bg-[var(--color-surface-2)]')}>Sign out</button>
                </div>
            </Section>

            <Section id="delete" title="Delete data">
                <div className="flex flex-col gap-3 py-3">
                    <p className="text-[15px] text-[var(--color-ink-secondary)]">This cannot be undone. We email you a code first.</p>
                    {!codeSent ? (
                        <form className="flex flex-wrap items-end gap-3" onSubmit={(e) => {
                            e.preventDefault();
                            void run('code', async () => { if (await onRequestCode(category)) setCodeSent(true); });
                        }}>
                            <label className="flex flex-col gap-1.5 text-[13px] font-medium">What to delete
                                <select value={category} onChange={(e) => setCategory(e.target.value as PurgeCategory)} className={cn(field, 'px-2 capitalize')}>
                                    {(['transactions', 'budgets', 'subscriptions', 'goals'] as const).map((c) => <option key={c} value={c}>All {c}</option>)}
                                </select>
                            </label>
                            <label className="flex flex-col gap-1.5 text-[13px] font-medium">Type DELETE
                                <input value={typed} onChange={(e) => setTyped(e.target.value)} className={cn(field, 'w-32')} autoComplete="off" />
                            </label>
                            <button type="submit" disabled={typed.trim().toUpperCase() !== 'DELETE' || busy === 'code'} className={cn(pill, 'bg-[var(--color-danger)] text-white')}>
                                {busy === 'code' ? 'Sending' : 'Send code'}
                            </button>
                        </form>
                    ) : (
                        <form className="flex flex-wrap items-end gap-3" onSubmit={(e) => {
                            e.preventDefault();
                            void run('delete', async () => { if (await onConfirmDelete(code.trim())) { setCodeSent(false); setTyped(''); setCode(''); } });
                        }}>
                            <label className="flex flex-col gap-1.5 text-[13px] font-medium">Code from {email || 'your email'}
                                <input value={code} onChange={(e) => setCode(e.target.value)} inputMode="numeric" autoComplete="one-time-code" className={cn(field, 'w-40 tabular-nums')} />
                            </label>
                            <button type="submit" disabled={code.trim().length < 4 || busy === 'delete'} className={cn(pill, 'bg-[var(--color-danger)] text-white')}>
                                {busy === 'delete' ? 'Deleting' : `Delete all ${category}`}
                            </button>
                            <button type="button" onClick={() => setCodeSent(false)} className={cn(pill, 'text-[var(--color-ink-secondary)] hover:bg-[var(--color-canvas)]')}>Cancel</button>
                        </form>
                    )}
                </div>
            </Section>
        </div>
    );
}
