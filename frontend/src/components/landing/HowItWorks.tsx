import { HOW_IT_WORKS } from './featureCatalog';

export default function HowItWorks() {
    return (
        <section id="how-it-works" className="scroll-mt-20 border-y border-[#E7E5E4] bg-[#F4F0EB]">
            <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
                <h2 className="font-display text-3xl font-semibold tracking-tight text-[#1C1917]">How it works</h2>
                <p className="mt-2 max-w-2xl text-[#57534E]">
                    Capture, review, plan, then analyze. You stay in control of what is real.
                </p>
                <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {HOW_IT_WORKS.map((step, index) => (
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
