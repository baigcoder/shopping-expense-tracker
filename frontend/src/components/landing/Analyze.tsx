import { BarChart3, Brain, Sparkles } from 'lucide-react';
import { ANALYZE_HIGHLIGHTS } from './featureCatalog';

const MOCK_BARS = [
    { label: 'Mon', thisWeek: 42, lastWeek: 55 },
    { label: 'Tue', thisWeek: 61, lastWeek: 48 },
    { label: 'Wed', thisWeek: 38, lastWeek: 52 },
    { label: 'Thu', thisWeek: 74, lastWeek: 60 },
    { label: 'Fri', thisWeek: 88, lastWeek: 70 },
    { label: 'Sat', thisWeek: 51, lastWeek: 64 },
    { label: 'Sun', thisWeek: 29, lastWeek: 41 },
];

export default function Analyze() {
    return (
        <section id="analyze" className="scroll-mt-20 border-y border-[#E7E5E4] bg-[#F4F0EB]">
            <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
                <h2 className="font-display text-3xl font-semibold tracking-tight text-[#1C1917]">How analysis works</h2>
                <p className="mt-2 max-w-2xl text-[#57534E]">
                    Charts and AI only treat approved ledger items as spent. Inbox captures stay pending until you review them.
                </p>

                <div className="mt-10 grid items-start gap-6 lg:grid-cols-[1.05fr_0.95fr]">
                    <div className="rounded-2xl border border-[#E7E5E4] bg-white p-5 shadow-[var(--shadow-md)] sm:p-6">
                        <div className="mb-5 flex items-center justify-between gap-3">
                            <div>
                                <p className="text-xs font-medium text-[#78716C]">Analytics</p>
                                <h3 className="font-display text-lg font-semibold text-[#1C1917]">This week vs last week</h3>
                            </div>
                            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FFE4E6] text-[#E11D48]">
                                <BarChart3 className="h-4 w-4" />
                            </span>
                        </div>
                        <div className="flex h-44 items-end gap-2 sm:gap-3">
                            {MOCK_BARS.map((day) => (
                                <div key={day.label} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                                    <div className="flex h-36 w-full items-end justify-center gap-0.5">
                                        <div className="w-[45%] rounded-t-md bg-[#1C1917]" style={{ height: `${day.thisWeek}%` }} />
                                        <div className="w-[45%] rounded-t-md bg-[#E11D48]/80" style={{ height: `${day.lastWeek}%` }} />
                                    </div>
                                    <span className="text-[11px] font-medium text-[#78716C]">{day.label}</span>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 flex gap-4 text-xs text-[#57534E]">
                            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-[#1C1917]" /> This week</span>
                            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-[#E11D48]/80" /> Last week</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {ANALYZE_HIGHLIGHTS.map((item, index) => {
                            const Icon = index === 0 ? BarChart3 : index === 1 ? Sparkles : Brain;
                            return (
                                <article key={item.title} className="rounded-2xl border border-[#E7E5E4] bg-white p-5 shadow-[var(--shadow-sm)]">
                                    <div className="mb-2 flex items-center gap-2">
                                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FFE4E6] text-[#E11D48]">
                                            <Icon className="h-4 w-4" />
                                        </span>
                                        <p className="text-xs font-medium text-[#E11D48]">{item.eyebrow}</p>
                                    </div>
                                    <h3 className="font-display font-semibold text-[#1C1917]">{item.title}</h3>
                                    <p className="mt-1.5 text-sm leading-relaxed text-[#57534E]">{item.body}</p>
                                    <ul className="mt-3 flex flex-wrap gap-2">
                                        {item.points.map((point) => (
                                            <li key={point} className="rounded-full bg-[#FAF8F5] px-2.5 py-1 text-[11px] font-medium text-[#57534E]">
                                                {point}
                                            </li>
                                        ))}
                                    </ul>
                                </article>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
}
