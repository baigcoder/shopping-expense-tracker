import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Footer() {
    return (
        <section id="extension" className="border-t border-[#E7E5E4] bg-[#1C1917] text-[#FAF8F5]">
            <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-4 py-14 sm:flex-row sm:items-center sm:px-6">
                <div>
                    <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">Add the extension, then breathe.</h2>
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
        </section>
    );
}
