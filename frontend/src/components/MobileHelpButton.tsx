// Mobile Help Button - Shows limitations info on mobile
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, X, Smartphone, Monitor, Check, AlertCircle, FileText, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

const MobileHelpButton = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 1024);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Only show on mobile
    if (!isMobile) return null;

    return (
        <>
            {/* Help Button */}
            <motion.button
                onClick={() => setIsOpen(true)}
                className={cn(
                    "fixed bottom-20 left-4 z-[85]",
                    "w-9 h-9 rounded-full",
                    "bg-[var(--color-surface)] border border-[var(--color-border)]",
                    "shadow-sm",
                    "flex items-center justify-center",
                    "text-[var(--color-muted)] hover:text-[var(--color-brand)] hover:border-[var(--color-brand)]",
                    "transition-all duration-150"
                )}
                whileTap={{ scale: 0.92 }}
                aria-label="Mobile and Desktop Guide"
            >
                <HelpCircle size={18} />
            </motion.button>

            {/* Help Modal */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
                            onClick={() => setIsOpen(false)}
                        />

                        {/* Modal */}
                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 50 }}
                            className="fixed bottom-0 left-0 right-0 z-[101] bg-[var(--color-surface)] rounded-t-2xl border-t border-[var(--color-border)] overflow-hidden max-h-[85vh] overflow-y-auto shadow-2xl"
                        >
                            {/* Header */}
                            <div className="sticky top-0 bg-[var(--color-surface)] border-b border-[var(--color-border)] p-4 flex items-center justify-between z-10">
                                <div>
                                    <h2 className="text-sm font-semibold text-[var(--color-ink)]">Platform Capabilities</h2>
                                    <p className="text-xs text-[var(--color-muted)]">Mobile Workspace vs Desktop Suite</p>
                                </div>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-1.5 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-surface-2)] text-[var(--color-muted)] transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="p-5 space-y-5">
                                {/* Mobile Section */}
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="p-1.5 rounded-lg bg-[var(--color-brand-soft)] text-[var(--color-brand)]">
                                            <Smartphone size={16} />
                                        </div>
                                        <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-ink)]">Active On Mobile</h3>
                                    </div>

                                    <div className="space-y-2">
                                        <FeatureItem icon={<Check />} text="Instant manual ledger logging" available />
                                        <FeatureItem icon={<Check />} text="Real-time multi-account balances" available />
                                        <FeatureItem icon={<Check />} text="AI Financial intelligence assistant" available />
                                        <FeatureItem icon={<Check />} text="Bank statement OCR parser" available />
                                        <FeatureItem icon={<Check />} text="Interactive spending trajectories" available />
                                        <FeatureItem icon={<Check />} text="Budget pace and safe headroom tracking" available />
                                    </div>
                                </div>

                                {/* Desktop Only Section */}
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                            <AlertCircle size={16} />
                                        </div>
                                        <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-ink)]">Desktop Optimized</h3>
                                    </div>

                                    <div className="space-y-2">
                                        <FeatureItem
                                            icon={<Monitor />}
                                            text="Automated checkout extension capture"
                                            available={false}
                                            reason="Chrome mobile restrictions prevent background extension tabs"
                                        />
                                    </div>
                                </div>

                                {/* Tips Section */}
                                <div className="bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-xl p-4">
                                    <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-ink)] mb-3">Workflow Recommendations</h4>
                                    <div className="space-y-2.5 text-xs text-[var(--color-secondary-ink)]">
                                        <div className="flex items-start gap-2.5">
                                            <FileText size={15} className="mt-0.5 text-[var(--color-brand)] shrink-0" />
                                            <p>Upload PDF bank statements under Activity &gt; Imports for automatic statement parsing</p>
                                        </div>
                                        <div className="flex items-start gap-2.5">
                                            <MessageSquare size={15} className="mt-0.5 text-[var(--color-brand)] shrink-0" />
                                            <p>Chat with Cashly AI: "I just spent Rs 850 at Metro Grocery" for hands-free categorization</p>
                                        </div>
                                        <div className="flex items-start gap-2.5">
                                            <Smartphone size={15} className="mt-0.5 text-[var(--color-brand)] shrink-0" />
                                            <p>Tap the + button in the bottom navigation for rapid transaction capture</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Desktop Promo */}
                                <div className="bg-[var(--color-ink)] rounded-xl p-4 text-white">
                                    <div className="flex items-center gap-2.5 mb-1.5">
                                        <Monitor size={18} className="text-[var(--color-brand)]" />
                                        <span className="text-xs font-semibold">Automated Browser Tracking</span>
                                    </div>
                                    <p className="text-xs text-white/70 leading-relaxed">
                                        Open Cashly on your desktop Chrome or Edge browser to link our companion extension for zero-click merchant tracking.
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};

// Feature item component
const FeatureItem = ({
    icon,
    text,
    available,
    reason
}: {
    icon: React.ReactNode;
    text: string;
    available: boolean;
    reason?: string;
}) => (
    <div className={cn(
        "flex items-start gap-3 p-2.5 rounded-lg border text-xs",
        available
            ? "bg-[var(--color-surface)] border-[var(--color-border)]"
            : "bg-[var(--color-surface-2)]/60 border-[var(--color-border)]/50"
    )}>
        <div className={cn(
            "p-1 rounded flex-shrink-0 [&>svg]:w-3.5 [&>svg]:h-3.5",
            available
                ? "bg-[var(--color-brand-soft)] text-[var(--color-brand)]"
                : "bg-zinc-200/50 dark:bg-zinc-800 text-[var(--color-muted)]"
        )}>
            {icon}
        </div>
        <div>
            <p className={cn(
                "font-medium",
                available ? "text-[var(--color-ink)]" : "text-[var(--color-muted)]"
            )}>
                {text}
            </p>
            {reason && (
                <p className="text-[11px] text-[var(--color-muted)] mt-0.5">{reason}</p>
            )}
        </div>
    </div>
);

export default MobileHelpButton;
