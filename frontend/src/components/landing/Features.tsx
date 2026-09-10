import { Brain, Chrome, FileText, Inbox, ShieldCheck, Target } from 'lucide-react';

const FEATURES = [
    { icon: Inbox, title: 'Review inbox', body: 'Detections wait in staging. Approve, edit, or merge before they become official.' },
    { icon: Chrome, title: 'Browser capture', body: 'The extension notices checkouts and subscriptions, then syncs them to Cashly.' },
    { icon: Brain, title: 'Grounded AI', body: 'Ask about spending using your real ledger — pending items stay labeled as pending.' },
    { icon: Target, title: 'Budgets and goals', body: 'See progress without a wall of charts competing for attention.' },
    { icon: ShieldCheck, title: 'Trusted merchants', body: 'Save a rule for stores you trust so repeats can post automatically.' },
    { icon: FileText, title: 'Reports', body: 'Export a clean monthly picture for yourself, taxes, or a shared household.' },
];

export default function Features() {
    return (
        <section id="features" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
            <h2 className="font-display text-3xl font-semibold tracking-tight text-[#1C1917]">Built around review, not noise</h2>
            <p className="mt-2 max-w-2xl text-[#57534E]">One accent, one job per screen, and copy a person would actually say.</p>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {FEATURES.map(({ icon: Icon, title, body }) => (
                    <article key={title} className="rounded-2xl border border-[#E7E5E4] bg-white p-5 shadow-[var(--shadow-sm)]">
                        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFE4E6] text-[#E11D48]">
                            <Icon className="h-5 w-5" />
                        </div>
                        <h3 className="font-display font-semibold text-[#1C1917]">{title}</h3>
                        <p className="mt-1.5 text-sm leading-relaxed text-[#57534E]">{body}</p>
                    </article>
                ))}
            </div>
        </section>
    );
}
