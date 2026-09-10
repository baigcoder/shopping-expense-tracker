const ITEMS = [
    {
        q: 'Does Cashly post charges automatically?',
        a: 'Only if you approve them, or if you set a trusted merchant rule. Everything else waits in the inbox.',
    },
    {
        q: 'What does the extension see?',
        a: 'Checkout pages and amounts — not your banking password. You still sign in to Cashly to sync. Shopping activity shows which sites it noticed.',
    },
    {
        q: 'Can I import a bank statement?',
        a: 'Yes. CSV, Excel, PDF, and receipt images go through the same review queue, with duplicate warnings before anything posts.',
    },
    {
        q: 'How does analysis stay honest?',
        a: 'Analytics, Money Twin, reports, and AI use approved ledger items. Pending inbox captures are labeled pending so they are not treated as spent.',
    },
    {
        q: 'What is Money Twin?',
        a: 'A forecast of your spending pace: daily rate, this month, and alerts when the pattern changes. It sits on the dashboard and has its own page.',
    },
    {
        q: 'Is the AI looking at live data?',
        a: 'Yes. The weekly coach and chat use your ledger. You can include pending inbox items, keep chat memory, or turn live AI off in Settings. Keys stay on the server.',
    },
];

export default function FAQ() {
    return (
        <section id="faq" className="mx-auto max-w-3xl scroll-mt-20 px-4 py-16 sm:px-6">
            <h2 className="font-display text-3xl font-semibold tracking-tight text-[#1C1917]">Questions</h2>
            <div className="mt-8 space-y-4">
                {ITEMS.map((item) => (
                    <details key={item.q} className="rounded-2xl border border-[#E7E5E4] bg-white px-5 py-4 shadow-[var(--shadow-sm)]">
                        <summary className="cursor-pointer font-display font-semibold text-[#1C1917]">{item.q}</summary>
                        <p className="mt-2 text-sm leading-relaxed text-[#57534E]">{item.a}</p>
                    </details>
                ))}
            </div>
        </section>
    );
}
