import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUp, Check, Mic } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ChatMessage { role: 'user' | 'assistant'; text: string; link?: { label: string; path: string }; retry?: string /* the question to ask again after a failure */ }
export interface PlanAction { id: string; title: string; description?: string; status: 'pending' | 'done' | 'skipped' }
export interface Insight { id: string; title: string; message: string; path?: string; urgent?: boolean }

interface AssistViewProps {
    messages: ChatMessage[];
    sending?: boolean;
    suggestions: string[];
    onSend: (text: string) => void;
    onVoice?: () => void;
    plan: PlanAction[] | null;
    planning?: boolean;
    onMakePlan: () => void;
    onToggle: (a: PlanAction) => void;
    insights: Insight[];
    basePath?: string;
}

export function AssistView({ messages, sending, suggestions, onSend, onVoice, plan, planning, onMakePlan, onToggle, insights, basePath = '' }: AssistViewProps) {
    const [text, setText] = useState('');
    const end = useRef<HTMLDivElement>(null);
    useEffect(() => { end.current?.scrollIntoView({ block: 'nearest' }); }, [messages.length, sending]);

    const send = (e?: FormEvent, value = text) => {
        e?.preventDefault();
        if (!value.trim() || sending) return;
        onSend(value.trim());
        setText('');
    };
    const done = plan?.filter((a) => a.status === 'done').length ?? 0;

    return (
        <div className="flex flex-col gap-4">
            <h1 className="pb-2 font-display text-[28px] font-bold tracking-tight sm:text-[32px]">Ask Cashly</h1>

            <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-4 lg:grid-cols-[minmax(0,8fr)_minmax(0,4fr)]">
                <section className="flex min-h-[560px] min-w-0 flex-col rounded-[20px] bg-[var(--color-surface)]" aria-label="Conversation" data-tour="assist-chat">
                    <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-5 sm:p-6" aria-live="polite">
                        {messages.length === 0 && (
                            <div className="m-auto flex max-w-[44ch] flex-col items-center gap-4 py-10 text-center">
                                <p className="font-display text-[22px] font-semibold tracking-tight">What do you want to know?</p>
                                <div className="flex flex-wrap justify-center gap-2">
                                    {suggestions.map((s) => (
                                        <button key={s} type="button" onClick={() => send(undefined, s)} className="rounded-full bg-[var(--color-canvas)] px-4 py-2 text-[14px] hover:bg-[var(--color-surface-2)]">{s}</button>
                                    ))}
                                </div>
                            </div>
                        )}
                        {messages.map((m, i) => (
                            <div key={i} className={cn('max-w-[85%] rounded-[18px] px-4 py-3 text-[15px] leading-relaxed', m.role === 'user' ? 'ml-auto bg-[var(--color-canvas)]' : 'bg-[var(--color-wine-soft)]')}>
                                <p className="whitespace-pre-wrap">{m.text}</p>
                                {m.link && <Link to={`${basePath}${m.link.path}`} className="mt-2 inline-block font-semibold underline underline-offset-4">{m.link.label}</Link>}
                                {m.retry && i === messages.length - 1 && !sending && (
                                    <button type="button" onClick={() => onSend(m.retry!)} className="mt-2 block font-semibold underline underline-offset-4">Try again</button>
                                )}
                            </div>
                        ))}
                        {sending && <p className="w-fit rounded-[18px] bg-[var(--color-wine-soft)] px-4 py-3 text-[15px] text-[var(--color-ink-secondary)]">Working it out…</p>}
                        <div ref={end} />
                    </div>
                    <form onSubmit={send} className="flex items-center gap-2 p-3 sm:p-4">
                        <label htmlFor="ask" className="sr-only">Ask about your money</label>
                        <input id="ask" value={text} onChange={(e) => setText(e.target.value)} placeholder="Can I afford a Rs 30,000 phone this month?" autoComplete="off"
                            className="h-12 min-w-0 flex-1 rounded-full bg-[var(--color-canvas)] px-5 text-[15px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ink)]" />
                        {onVoice && (
                            <button type="button" onClick={onVoice} aria-label="Talk instead" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--color-canvas)] hover:bg-[var(--color-surface-2)]"><Mic size={18} /></button>
                        )}
                        <button type="submit" disabled={!text.trim() || sending} aria-label="Send"
                            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand)] text-[var(--color-on-brand)] hover:bg-[var(--color-brand-hover)] disabled:opacity-40"><ArrowUp size={20} /></button>
                    </form>
                </section>

                <aside className="flex flex-col gap-4">
                    <section className="rounded-[20px] bg-[var(--color-surface)] p-5" aria-labelledby="plan-h" data-tour="assist-plan">
                        <div className="flex items-baseline justify-between gap-3">
                            <h2 id="plan-h" className="font-display text-[17px] font-semibold">This week</h2>
                            {plan && plan.length > 0 && <p className="text-[14px] tabular-nums text-[var(--color-ink-secondary)]">{done} of {plan.length}</p>}
                        </div>
                        {!plan || plan.length === 0 ? (
                            <button type="button" onClick={onMakePlan} disabled={planning}
                                className="mt-4 h-11 w-full rounded-full bg-[var(--color-ink)] text-[15px] font-semibold text-[var(--color-on-ink)] hover:opacity-90 disabled:opacity-50">{planning ? 'Making a plan…' : 'Make this week’s plan'}</button>
                        ) : (
                            <ul className="mt-3 flex flex-col gap-1">
                                {plan.map((a) => (
                                    <li key={a.id}>
                                        <label className="flex cursor-pointer items-start gap-3 rounded-[12px] p-2 hover:bg-[var(--color-canvas)]">
                                            <input type="checkbox" checked={a.status === 'done'} onChange={() => onToggle(a)} className="peer sr-only" />
                                            <span className={cn('mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--color-brand)]', a.status === 'done' ? 'border-[var(--color-success)] bg-[var(--color-success)] text-[var(--color-on-ink)]' : 'border-[var(--color-border-strong)]')} aria-hidden>
                                                {a.status === 'done' && <Check size={12} strokeWidth={3} />}
                                            </span>
                                            <span className={cn('text-[15px] leading-snug', a.status === 'done' && 'text-[var(--color-muted)] line-through')}>{a.title}</span>
                                        </label>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>

                    {insights.length > 0 && (
                        <section className="rounded-[20px] bg-[var(--color-surface)] p-5" aria-labelledby="look-h" data-tour="assist-insights">
                            <h2 id="look-h" className="font-display text-[17px] font-semibold">Worth a look</h2>
                            <ul className="mt-3 flex flex-col gap-4">
                                {insights.slice(0, 3).map((i) => (
                                    <li key={i.id}>
                                        <p className={cn('text-[15px] font-semibold', i.urgent && 'text-[var(--color-danger)]')}>{i.title}</p>
                                        <p className="mt-0.5 text-[14px] leading-relaxed text-[var(--color-ink-secondary)]">{i.message}</p>
                                        {i.path && <Link to={`${basePath}${i.path}`} className="mt-1 inline-block text-[14px] font-medium underline underline-offset-4">Open</Link>}
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}
                </aside>
            </div>
        </div>
    );
}
