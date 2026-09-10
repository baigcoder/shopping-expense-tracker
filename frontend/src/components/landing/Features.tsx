import { FEATURE_GROUPS } from './featureCatalog';

export default function Features() {
    return (
        <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6 sm:py-20">
            <h2 className="font-display text-3xl font-semibold tracking-tight text-[#1C1917]">Everything in Cashly</h2>
            <p className="mt-2 max-w-2xl text-[#57534E]">
                From the inbox to Analytics, Money Twin, and reports — one cream workspace, one rose accent.
            </p>

            <div className="mt-12 space-y-14">
                {FEATURE_GROUPS.map((group) => (
                    <div key={group.id} id={group.id === 'analyze' ? undefined : group.id}>
                        <h3 className="font-display text-xl font-semibold tracking-tight text-[#1C1917] sm:text-2xl">{group.title}</h3>
                        <p className="mt-1.5 max-w-2xl text-sm text-[#57534E] sm:text-base">{group.description}</p>
                        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {group.features.map(({ icon: Icon, title, description }) => (
                                <article key={title} className="rounded-2xl border border-[#E7E5E4] bg-white p-5 shadow-[var(--shadow-sm)]">
                                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFE4E6] text-[#E11D48]">
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <h4 className="font-display font-semibold text-[#1C1917]">{title}</h4>
                                    <p className="mt-1.5 text-sm leading-relaxed text-[#57534E]">{description}</p>
                                </article>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
