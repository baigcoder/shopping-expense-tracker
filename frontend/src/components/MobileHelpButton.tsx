// Mobile Help Button - Shows limitations info on mobile
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, X, Smartphone, Monitor, Check, AlertCircle, FileText, Camera, MessageSquare } from 'lucide-react';
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
                    "fixed bottom-20 left-4 z-[90]",
                    "w-10 h-10",
                    "bg-white border-2 border-black",
                    "shadow-[3px_3px_0_#E11D48]",
                    "flex items-center justify-center",
                    "text-black hover:bg-black hover:text-white",
                    "transition-all duration-150"
                )}
                whileTap={{ scale: 0.9 }}
            >
                <HelpCircle size={20} />
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
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]"
                            onClick={() => setIsOpen(false)}
                        />

                        {/* Modal */}
                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 50 }}
                            className="fixed bottom-0 left-0 right-0 z-[101] bg-white border-t-4 border-black overflow-hidden max-h-[85vh] overflow-y-auto"
                        >
                            {/* Header */}
                            <div className="sticky top-0 bg-black text-white border-b-4 border-[#E11D48] p-4 flex items-center justify-between">
                                <h2 className="text-sm font-black uppercase tracking-widest">Mobile vs Desktop</h2>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-1.5 border-2 border-white hover:bg-[#E11D48] transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="p-5 space-y-6">
                                {/* Mobile Section */}
                                <div>
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="p-2 bg-black border-2 border-black">
                                            <Smartphone size={18} className="text-[#E11D48]" />
                                        </div>
                                        <h3 className="font-black uppercase tracking-widest text-black">On Mobile</h3>
                                    </div>

                                    <div className="space-y-3">
                                        <FeatureItem icon={<Check />} text="Add spending manually" available />
                                        <FeatureItem icon={<Check />} text="View all your data" available />
                                        <FeatureItem icon={<Check />} text="AI chat assistant" available />
                                        <FeatureItem icon={<Check />} text="Import bank PDFs" available />
                                        <FeatureItem icon={<Check />} text="View charts & insights" available />
                                        <FeatureItem icon={<Check />} text="Manage budgets & goals" available />
                                    </div>
                                </div>

                                {/* Not Available Section */}
                                <div>
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="p-2 bg-[#F59E0B] border-2 border-black">
                                            <AlertCircle size={18} className="text-black" />
                                        </div>
                                        <h3 className="font-black uppercase tracking-widest text-black">Desktop Only</h3>
                                    </div>

                                    <div className="space-y-3">
                                        <FeatureItem
                                            icon={<Monitor />}
                                            text="Auto-capture (browser extension)"
                                            available={false}
                                            reason="Chrome mobile doesn't support extensions"
                                        />
                                    </div>
                                </div>

                                {/* Tips Section */}
                                <div className="bg-white border-[3px] border-black shadow-[4px_4px_0_#E11D48] p-4">
                                    <h4 className="font-black uppercase tracking-widest text-black mb-3">💡 Tips for Mobile</h4>
                                    <div className="space-y-2 text-sm text-zinc-700 font-medium">
                                        <div className="flex items-start gap-2">
                                            <FileText size={16} className="mt-0.5 flex-shrink-0" />
                                            <p>Upload bank statements (PDF) to import transactions</p>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <MessageSquare size={16} className="mt-0.5 flex-shrink-0" />
                                            <p>Use AI chat: "I spent Rs 500 at Grocery Store"</p>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <Smartphone size={16} className="mt-0.5 flex-shrink-0" />
                                            <p>Tap the + button for quick expense entry</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Desktop Promo */}
                                <div className="bg-black border-2 border-black p-4 text-white shadow-[6px_6px_0_#E11D48]">
                                    <div className="flex items-center gap-3 mb-2">
                                        <Monitor size={20} className="text-[#E11D48]" />
                                        <span className="font-black uppercase tracking-widest">Want auto-tracking?</span>
                                    </div>
                                    <p className="text-sm text-zinc-300 font-medium">
                                        Open Cashly on a desktop browser to install our extension and automatically capture online purchases!
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
        "flex items-start gap-3 p-3 border-2",
        available ? "bg-[#ECFDF5] border-black" : "bg-zinc-50 border-zinc-300"
    )}>
        <div className={cn(
            "p-1 border-2 flex-shrink-0",
            available ? "bg-black border-black text-white" : "bg-white border-zinc-300 text-zinc-400"
        )}>
            {icon}
        </div>
        <div>
            <p className={cn(
                "font-bold text-sm",
                available ? "text-black" : "text-zinc-500"
            )}>
                {text}
            </p>
            {reason && (
                <p className="text-xs text-zinc-400 mt-0.5">{reason}</p>
            )}
        </div>
    </div>
);

export default MobileHelpButton;
