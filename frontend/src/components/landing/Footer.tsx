import { Link } from 'react-router-dom';
import { ArrowRight, Chrome, Inbox, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

const STEPS = [
    { icon: Chrome, title: 'Shop as usual', body: 'The extension notices a checkout or trial. No bank login.' },
    { icon: Inbox, title: 'It waits in Inbox', body: 'Edit amount or category, merge a duplicate, or reject it.' },
    { icon: ShieldCheck, title: 'You approve', body: 'Only then does it hit the ledger, budgets, and Analytics.' },
];

export default function Footer() {
    return (
        <section id="extension" className="scroll-mt-20 border-t border-[#E7E5E4] bg-[#1C1917] text-[#FAF8F5]">
            <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
                <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
                    <div>
                        <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">Add the extension, then review.</h2>
                        <p className="mt-2 max-w-xl text-sm text-[#A8A29E]">
                            Capture happens in the background. You decide what is real when you open the inbox.
                        </p>
                    </div>
                    <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                        <Button asChild>
                            <Link to="/signup">
                                Get started
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </Button>
                        <Button asChild variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10">
                            <a href="/cashly-extension.zip">Download extension</a>
                        </Button>
                    </div>
                </div>

                <div className="mt-10 grid gap-4 sm:grid-cols-3">
                    {STEPS.map(({ icon: Icon, title, body }, index) => (
                        <article key={title} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                            <p className="text-xs font-medium text-[#FDA4AF]">{index + 1}</p>
                            <div className="mt-3 flex items-center gap-2">
                                <Icon className="h-4 w-4 text-[#FDA4AF]" />
                                <h3 className="font-display font-semibold">{title}</h3>
                            </div>
                            <p className="mt-2 text-sm leading-relaxed text-[#A8A29E]">{body}</p>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}
