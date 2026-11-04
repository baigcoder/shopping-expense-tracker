import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Check, X } from 'lucide-react';
import { MarketingFooter, MarketingNav } from '@/components/landing/MarketingChrome';
import { LiveCheckoutCard } from '@/features/landing/LiveCheckoutCard';
import { Questions } from '@/features/landing/Questions';
import { useReveal } from '@/lib/reveal';
import { cn } from '@/lib/utils';

const rs = (n: number) => `Rs ${n.toLocaleString('en-PK')}`;
const wrap = 'mx-auto w-full max-w-[1320px] px-5 sm:px-8';
const btnPrimary = 'inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[var(--color-brand)] px-6 text-[16px] font-semibold text-[var(--color-on-brand)] transition-colors hover:bg-[var(--color-brand-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand)]';

/* ── What you get: four outputs, one true-size sheet at a time ───────────────── */

function ReviewSheet() {
    return (
        <div data-ui className="w-[420px] max-w-full rounded-[18px] bg-[var(--color-surface)] p-6">
            <p className="font-display text-[17px] font-semibold">Waiting for your approval</p>
            {[['Daraz', 'Anker power bank', 8499, 151273], ['Foodpanda', 'Dinner from Kolachi', 3260, 148013], ['Spotify', 'Premium Duo, monthly', 579, 147434]].map(([m, d, a, s]) => (
                <div key={m as string} className="mt-3 rounded-[14px] bg-[var(--color-canvas)] p-4">
                    <div className="flex justify-between gap-3"><span className="font-semibold">{m}</span><span className="font-display font-semibold tabular-nums">{rs(a as number)}</span></div>
                    <p className="text-[14px] text-[var(--color-ink-secondary)]">{d}</p>
                    <p className="mt-2 text-[13px] text-[var(--color-muted)]">Safe to spend after: <b className="text-[var(--color-ink)] tabular-nums">{rs(s as number)}</b></p>
                </div>
            ))}
        </div>
    );
}

function StatementSheet() {
    const rows: [string, number, boolean?][] = [['Salary', 245000, true], ['Freelance design', 38000, true], ['Rent', 65000], ['Food', 29580], ['Bills', 14799], ['Transport', 11150], ['Shopping', 7490], ['Entertainment', 2400], ['Health', 1860]];
    const income = 283000, out = 132279;
    return (
        <div data-ui className="w-[520px] max-w-full rounded-[18px] bg-[var(--color-surface)] p-7">
            <div className="flex items-baseline justify-between"><p className="font-display text-[20px] font-bold">November, on one page</p><p className="text-[13px] text-[var(--color-muted)]">Ayesha Khan</p></div>
            <table className="mt-5 w-full text-[14px]">
                <caption className="sr-only">Monthly statement</caption>
                <tbody>
                    {rows.map(([k, v, inc]) => (
                        <tr key={k} className="border-b border-[var(--color-canvas)]"><td className="py-2">{k}</td><td className={cn('py-2 text-right tabular-nums', inc && 'text-[var(--color-success)]')}>{inc ? '+' : ''}{rs(v)}</td></tr>
                    ))}
                </tbody>
                <tfoot>
                    <tr><td className="pt-4 font-semibold">Left over</td><td className="pt-4 text-right font-display text-[18px] font-bold tabular-nums">{rs(income - out)}</td></tr>
                </tfoot>
            </table>
        </div>
    );
}

function RunwaySheet() {
    const [cut, setCut] = useState(5000);
    const days = 25 + Math.round(cut / 900);
    return (
        <div data-ui className="w-[480px] max-w-full rounded-[18px] bg-[var(--color-surface)] p-7">
            <p className="text-[14px] text-[var(--color-ink-secondary)]">At your pace, your money lasts</p>
            <p className="font-display text-[44px] font-bold leading-none tabular-nums">{days} days</p>
            <svg viewBox="0 0 420 120" className="mt-5 w-full" role="img" aria-label={`Balance falls to zero after ${days} days`}>
                <line x1="0" x2="420" y1="110" y2="110" stroke="var(--color-surface-2)" />
                <path d={`M0,12 C140,30 260,60 ${Math.min(410, days * 12)},108`} fill="none" stroke="var(--color-ink)" strokeWidth="2.5" />
                <circle cx={Math.min(410, days * 12)} cy="108" r="5" fill="var(--color-brand)" />
            </svg>
            <label className="mt-5 block text-[14px]">
                <span className="flex justify-between"><span>Spend less on food</span><b className="tabular-nums">{rs(cut)}</b></span>
                <input type="range" min={0} max={15000} step={500} value={cut} onChange={(e) => setCut(Number(e.target.value))} className="mt-2 w-full accent-[var(--color-ink)]" />
            </label>
        </div>
    );
}

function AnswerSheet() {
    return (
        <div data-ui className="w-[500px] max-w-full rounded-[18px] bg-[var(--color-surface)] p-7">
            <p className="ml-auto w-fit max-w-[85%] rounded-[16px] bg-[var(--color-canvas)] px-4 py-3 text-[15px]">Can I afford a Rs 30,000 phone this month?</p>
            <div className="mt-4 rounded-[16px] bg-[var(--color-wine-soft)] px-4 py-4 text-[15px] leading-relaxed text-[var(--color-ink)]">
                <p>Yes, with room to spare. You have <b>{rs(159772)}</b> safe to spend after rent and Netflix.</p>
                <p className="mt-2">Buying it leaves <b>{rs(129772)}</b>, which still lasts about 21 days at your pace. Three purchases (<b>{rs(12338)}</b>) are still waiting for you and are not counted yet.</p>
            </div>
        </div>
    );
}

const OUTPUTS = [
    { id: 'review', label: 'The review card', sheet: <ReviewSheet /> },
    { id: 'statement', label: 'Your month, on one page', sheet: <StatementSheet /> },
    { id: 'runway', label: 'How long it lasts', sheet: <RunwaySheet /> },
    { id: 'answer', label: 'An answer, with the maths', sheet: <AnswerSheet /> },
];

function WhatYouGet() {
    const [sel, setSel] = useState(0);
    return (
        <section id="what" className="scroll-mt-20 py-[clamp(72px,9vw,136px)]" aria-labelledby="what-h" data-reveal-group>
            <div className={cn(wrap, 'grid gap-10 lg:grid-cols-12')}>
                <div className="lg:col-span-5">
                    <h2 id="what-h" className="sr-only">What you get</h2>
                    <ul role="tablist" aria-label="What Cashly makes" className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:gap-1 lg:overflow-visible" data-reveal>
                        {OUTPUTS.map((o, i) => (
                            <li key={o.id} className="shrink-0">
                                <button type="button" role="tab" aria-selected={sel === i} onClick={() => setSel(i)}
                                    style={{ fontSize: 'clamp(22px, 3.4vw, 52px)' }}
                                    className={`text-left font-display font-semibold leading-[1.1] tracking-tight transition-colors ${sel === i ? 'text-[color:var(--color-ink)]' : 'text-[color:rgba(17,17,17,0.35)] hover:text-[color:rgba(17,17,17,0.7)]'}`}>
                                    {o.label}
                                </button>
                            </li>
                        ))}
                    </ul>
                    <p className="mt-8 max-w-[44ch] text-[17px] leading-relaxed text-[var(--color-ink-secondary)]" data-reveal>
                        Everything Cashly shows you is made from purchases you approved. Pick one to see it at real size.
                    </p>
                </div>
                <div className="overflow-hidden rounded-[24px] bg-[var(--color-surface-2)] px-4 pt-10 sm:px-12 lg:col-span-7 lg:h-[600px]" data-reveal>
                    <div key={OUTPUTS[sel].id} style={{ animation: 'fade-up .25s ease both' }}>
                        {OUTPUTS[sel].sheet}
                    </div>
                </div>
            </div>
        </section>
    );
}

/* ── How it works: what you do, and what comes back ───────────────────────── */

function HowItWorks() {
    return (
        <section id="how" className="scroll-mt-20 bg-[var(--color-surface)] py-[clamp(72px,9vw,136px)]" aria-labelledby="how-h" data-reveal-group>
            <div className={cn(wrap, 'grid gap-12 lg:grid-cols-12')}>
                <div className="lg:sticky lg:top-24 lg:col-span-4 lg:self-start" data-reveal>
                    <h2 id="how-h" className="font-display text-[length:clamp(32px,4vw,56px)] font-bold leading-[1.02] tracking-[-0.03em]">Three moves, then you know</h2>
                    <p className="mt-5 max-w-[36ch] text-[17px] leading-relaxed text-[var(--color-ink-secondary)]">What you do on the left of each step, what Cashly gives back under it.</p>
                </div>
                <div className="flex flex-col gap-24 lg:col-span-8">
                    <div data-reveal>
                        <p className="text-[20px] font-semibold">First, shop the way you already do.</p>
                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-[14px] bg-[var(--color-canvas)] p-5 text-[15px]">
                            <span className="text-[var(--color-ink-secondary)]">daraz.pk · Order total</span>
                            <span className="font-display text-[20px] font-bold tabular-nums">{rs(8499)}</span>
                            <span className="rounded-full bg-[#F57224] px-4 py-2 text-[14px] font-semibold text-[var(--color-ink)]">Place order</span>
                        </div>
                        <div data-ui className="mt-4 rounded-[14px] bg-[var(--color-ink)] p-4 text-white sm:ml-14">
                            <p className="text-[14px] text-white/70">Cashly, in the corner of the page</p>
                            <p className="mt-1 text-[16px]">Caught <b>{rs(8499)}</b> at Daraz. It is waiting in your inbox.</p>
                        </div>
                    </div>
                    <div data-reveal>
                        <p className="text-[20px] font-semibold">Then say yes, or say not mine.</p>
                        <div className="mt-4 flex gap-2 rounded-[14px] bg-[var(--color-canvas)] p-4">
                            <span className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-full bg-[var(--color-surface)] text-[15px]"><X size={16} /> Not mine</span>
                            <span className="inline-flex h-11 flex-[1.4] items-center justify-center gap-1.5 rounded-full bg-[var(--color-ink)] text-[15px] font-semibold text-white"><Check size={16} /> Approve</span>
                        </div>
                        <div data-ui className="mt-4 rounded-[14px] bg-[var(--color-canvas)] p-4 sm:ml-14">
                            <div className="flex justify-between text-[15px]"><span>Shopping budget</span><span className="tabular-nums"><b>{rs(15989)}</b> of {rs(15000)}</span></div>
                            <div className="mt-2 h-2 rounded-full bg-[var(--cat-shopping-soft)]"><div className="h-full w-full rounded-full bg-[var(--color-danger)]" /></div>
                            <p className="mt-2 text-[14px] text-[var(--color-danger)]">{rs(989)} over. You saw it before it was booked.</p>
                        </div>
                    </div>
                    <div data-reveal>
                        <p className="text-[20px] font-semibold">Then ask anything about your money.</p>
                        <div className="mt-4 flex items-center justify-between gap-3 rounded-[14px] bg-[var(--color-canvas)] px-5 py-4 text-[16px]">
                            <span>Will I make rent if I keep eating out?</span><ArrowRight size={18} aria-hidden />
                        </div>
                        <div data-ui className="mt-4 rounded-[16px] bg-[var(--color-wine-soft)] p-5 text-[16px] leading-relaxed sm:ml-14 ">
                            Yes. Rent of <b>{rs(65000)}</b> is due in 16 days and you will have about <b>{rs(94000)}</b> by then. At your current pace food lands at <b>{rs(36400)}</b> this month, still under its <b>{rs(40000)}</b> budget.
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

/* ── Features as one paragraph with pieces of the product in it ───────────── */

const Slot = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <span data-ui aria-hidden className={cn('mx-[0.12em] inline-flex h-[1em] min-w-[1.9em] translate-y-[0.12em] items-center justify-center rounded-[0.22em] px-[0.3em] align-baseline text-[0.5em] font-semibold whitespace-nowrap', className)}>{children}</span>
);

function Features() {
    return (
        <section className="py-[clamp(72px,9vw,136px)]" aria-labelledby="feat-h" data-reveal-group>
            <div className={wrap}>
                <h2 id="feat-h" className="sr-only">What it does</h2>
                <p className="max-w-[34ch] font-display text-[length:clamp(22px,2.2vw,30px)] font-medium leading-[1.35] tracking-tight" data-reveal>
                    Cashly catches a checkout on any store<Slot className="bg-[var(--color-ink)] text-white">daraz.pk</Slot>, holds it in one inbox<Slot className="bg-[var(--color-brand)] text-[var(--color-on-brand)]">3 waiting</Slot>, fills your budgets as you approve<Slot className="bg-[var(--cat-food-soft)] text-[var(--cat-food)]">Food 74%</Slot>, and warns you before a free trial turns into a charge<Slot className="bg-[var(--color-wine-soft)] text-[var(--color-wine)]">ends in 2 days</Slot>.
                </p>
                <div className="mt-16 flex flex-wrap items-center gap-6 lg:ml-[50%]" data-reveal>
                    <p className="max-w-[40ch] text-[18px] leading-relaxed text-[var(--color-ink-secondary)]">No bank password, ever. It reads the order total on the page you are already looking at.</p>
                    <Link to="/demo" className={btnPrimary}>Try the demo <ArrowRight size={18} /></Link>
                </div>
            </div>
        </section>
    );
}

/* ── Close: the sentence with a blank ─────────────────────────────────────── */

function Close() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const submit = (e: FormEvent) => {
        e.preventDefault();
        navigate(`/signup${email ? `?email=${encodeURIComponent(email)}` : ''}`);
    };
    return (
        <section className="py-[clamp(72px,9vw,136px)]" aria-labelledby="close-h" data-reveal-group>
            <div className={cn(wrap, 'grid items-end gap-10 lg:grid-cols-12')}>
            <form onSubmit={submit} className="lg:col-span-8" data-reveal>
                <h2 id="close-h" className="font-display text-[length:clamp(32px,5vw,72px)] font-bold leading-[1.15] tracking-[-0.03em]">
                    Start with{' '}
                    <label className="sr-only" htmlFor="close-email">Your email</label>
                    <input id="close-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your email"
                        className="inline-block h-[1.15em] w-full max-w-[7.5em] rounded-[0.2em] bg-[var(--color-surface)] px-[0.25em] align-baseline font-display font-bold tracking-[-0.03em] text-[var(--color-ink)] placeholder:text-[var(--color-ink)]/35 focus:outline focus:outline-[3px] focus:outline-[var(--color-brand)] sm:w-[7.5em]" />{' '}
                    <button type="submit" className="inline-block h-[1.15em] rounded-[0.2em] bg-[var(--color-brand)] px-[0.3em] align-baseline font-bold tracking-[-0.03em] text-[var(--color-on-brand)] transition-colors hover:bg-[var(--color-brand-hover)]">today</button>
                </h2>
                <p className="mt-6 text-[16px] text-[var(--color-ink-secondary)]">Takes you to sign up with your email filled in. Or <Link to="/demo" className="font-semibold text-[var(--color-ink)] underline underline-offset-4">try the demo first</Link>.</p>
            </form>
            <img src="/images/world/night-at-saddar-karachi-1600.jpg" alt="A quiet street in Saddar, Karachi, at night" width={1600} height={1067} loading="lazy"
                className="aspect-[4/5] w-full rounded-[24px] object-cover lg:col-span-4" data-reveal />
            </div>
        </section>
    );
}

export default function LandingPage() {
    useReveal();
    useEffect(() => { document.documentElement.classList.remove('dark'); }, []);

    return (
        <div className="min-h-screen bg-[var(--color-canvas)] text-[var(--color-ink)]">
            <MarketingNav tone="dark" />
            <main>
                {/* Hero: split ground, the working fragment on the right */}
                <section className="grid min-h-[calc(100svh-72px)] lg:grid-cols-[1.2fr_1fr]" aria-labelledby="hero-h">
                    <div className="flex flex-col justify-end bg-[var(--color-ink)] px-5 pb-12 pt-10 text-white sm:px-8 lg:pb-16 lg:pl-[max(32px,calc((100vw-1320px)/2+32px))]">
                        <h1 id="hero-h" className="font-display text-[length:clamp(34px,4.2vw,66px)] font-bold leading-[1.02] tracking-[-0.035em]">
                            <span className="mask-line"><span>See every purchase</span></span>
                            <span className="mask-line"><span>before it counts.</span></span>
                        </h1>
                        <p className="after-mask mt-6 max-w-[44ch] text-[18px] leading-relaxed text-white/80">
                            Cashly catches each online checkout and holds it for your yes. Your budget, your forecast and your AI answers only ever use numbers you checked.
                        </p>
                        <div className="after-mask mt-8 flex flex-wrap items-center gap-5">
                            <Link to="/demo" className={btnPrimary}>Try the demo <ArrowRight size={18} /></Link>
                            <Link to="/signup" className="text-[16px] font-medium text-white underline underline-offset-4 hover:text-white/80">Create a free account</Link>
                        </div>
                    </div>
                    <div className="flex items-center justify-center bg-[#1F1F1D] px-5 py-12 sm:px-8 order-first lg:order-none">
                        <LiveCheckoutCard />
                    </div>
                </section>

                <WhatYouGet />
                <HowItWorks />
                <Features />
                <figure className="px-2 sm:px-3" data-reveal-group>
                    <img src="/images/world/empress-market-1600.jpg" alt="Shoppers, rickshaws and stalls outside Empress Market in Karachi" width={1024} height={681} loading="lazy"
                        className="aspect-[16/7] w-full rounded-[24px] object-cover object-[50%_70%]" data-reveal />
                    <figcaption className={cn(wrap, 'mt-4 text-[15px] text-[var(--color-ink-secondary)]')} data-reveal>Empress Market, Karachi. People still count every rupee here; Cashly does the same for the checkouts you never see on paper.</figcaption>
                </figure>
                <Questions className="bg-[var(--color-surface)]" />
                <Close />
            </main>
            <p className={cn(wrap, 'pb-6 text-[13px] text-[var(--color-muted)]')}>
                Pictures: <a className="underline" href="https://www.flickr.com/photos/97409368@N00/3124979689">“Empress Market”</a> by Umair Mohsin, <a className="underline" href="https://creativecommons.org/licenses/by/2.0/">CC BY 2.0</a>; <a className="underline" href="https://commons.wikimedia.org/w/index.php?curid=58420607">“Night at Saddar, Karachi”</a> by Muhammad Ahmed, <a className="underline" href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a>.
            </p>
            <MarketingFooter />
        </div>
    );
}
