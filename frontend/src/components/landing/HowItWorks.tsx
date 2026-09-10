const STEPS = [
    { title: 'Install Cashly', body: 'Create an account and add the browser extension. It watches checkouts — not your passwords.' },
    { title: 'Review the inbox', body: 'New charges wait for you. Approve, edit, merge, or reject before anything hits the ledger.' },
    { title: 'See the picture', body: 'Budgets, bills, and AI coaching use approved numbers, so advice stays honest.' },
];

export default function HowItWorks() {
    return (
        <section id="how-it-works" className="border-y border-[#E7E5E4] bg-[#F4F0EB]">
            <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
                <h2 className="font-display text-3xl font-semibold tracking-tight text-[#1C1917]">How it works</h2>
                <p className="mt-2 max-w-2xl text-[#57534E]">Three quiet steps. You stay in control of what is real.</p>
                <div className="mt-10 grid gap-5 md:grid-cols-3">
                    {STEPS.map((step, index) => (
                        <article key={step.title} className="rounded-2xl border border-[#E7E5E4] bg-white p-6 shadow-[var(--shadow-sm)]">
                            <p className="text-sm font-medium text-[#E11D48]">{index + 1}</p>
                            <h3 className="mt-2 font-display text-lg font-semibold text-[#1C1917]">{step.title}</h3>
                            <p className="mt-2 text-sm leading-relaxed text-[#57534E]">{step.body}</p>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}
