import { useState, type FormEvent } from 'react';
import StaticPageTemplate from '../components/StaticPageTemplate';
import { Input } from '@/components/ui/input';

// shortcut: no contact backend exists, so the form opens the visitor's own email app; wire an API before relying on in-page sending.
const SUPPORT_EMAIL = 'support@cashly.app';

const ContactPage = () => {
    const [name, setName] = useState('');
    const [topic, setTopic] = useState('A question');
    const [message, setMessage] = useState('');

    const send = (e: FormEvent) => {
        e.preventDefault();
        const subject = `${topic}${name ? ` from ${name}` : ''}`;
        window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
    };

    return (
        <StaticPageTemplate title="Talk to us" subtitle="A question, a bug, or a store the extension missed. Write to us and a person reads it." prose={false}>
            <div className="grid gap-12 lg:grid-cols-12">
                <div className="flex flex-col gap-8 lg:col-span-5">
                    <div className="rounded-[20px] bg-[var(--color-surface)] p-6">
                        <h2 className="font-display text-[20px] font-semibold">Email</h2>
                        <a href={`mailto:${SUPPORT_EMAIL}`} className="mt-2 inline-block text-[18px] underline underline-offset-4">{SUPPORT_EMAIL}</a>
                    </div>
                    <div className="rounded-[20px] bg-[var(--color-surface)] p-6">
                        <h2 className="font-display text-[20px] font-semibold">Found a bug?</h2>
                        <p className="mt-2 text-[16px] leading-relaxed text-[var(--color-ink-secondary)]">
                            Report it in public on <a href="https://github.com/baigcoder/shopping-expense-tracker/issues" className="font-medium text-[var(--color-ink)] underline underline-offset-4">GitHub issues</a>, with the store and what you expected to see.
                        </p>
                    </div>
                </div>

                <form onSubmit={send} className="flex flex-col gap-5 rounded-[20px] bg-[var(--color-surface)] p-6 sm:p-8 lg:col-span-7" aria-labelledby="form-h">
                    <h2 id="form-h" className="font-display text-[24px] font-semibold tracking-tight">Write a message</h2>
                    <label className="flex flex-col gap-2 text-[14px] font-medium">
                        Your name
                        <Input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
                    </label>
                    <label className="flex flex-col gap-2 text-[14px] font-medium">
                        About
                        <select value={topic} onChange={(e) => setTopic(e.target.value)}
                            className="h-12 rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[15px]">
                            {['A question', 'A bug', 'A store the extension missed', 'An idea'].map((t) => <option key={t}>{t}</option>)}
                        </select>
                    </label>
                    <label className="flex flex-col gap-2 text-[14px] font-medium">
                        Message
                        <textarea value={message} onChange={(e) => setMessage(e.target.value)} required rows={6}
                            className="rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-3 text-[15px] leading-relaxed focus-visible:border-[var(--color-ink)] focus-visible:outline-none" />
                    </label>
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <p className="text-[14px] text-[var(--color-ink-secondary)]" id="send-note">Opens your email app with this message ready to send.</p>
                        <button type="submit" aria-describedby="send-note"
                            className="inline-flex h-12 items-center rounded-full bg-[var(--color-brand)] px-6 text-[16px] font-semibold text-[var(--color-on-brand)] hover:bg-[var(--color-brand-hover)]">
                            Open email
                        </button>
                    </div>
                </form>
            </div>
        </StaticPageTemplate>
    );
};

export default ContactPage;
