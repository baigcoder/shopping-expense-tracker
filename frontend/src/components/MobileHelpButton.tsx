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
                    "w-10 h-10 rounded-xl",
                    "bg-white border-2 border-slate-200",
                    "shadow-lg shadow-slate-200/50",
                    "flex items-center justify-center",
                    "text-slate-500 hover:text-blue-600",
                    "transition-all duration-200"
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
                            className="fixed bottom-0 left-0 right-0 z-[101] bg-white rounded-t-3xl shadow-2xl overflow-hidden max-h-[85vh] overflow-y-auto"
                        >
                            {/* Header */}
                            <div className="sticky top-0 bg-white border-b border-slate-100 p-4 flex items-center justify-between">
                                <h2 className="text-lg font-bold text-slate-800">Mobile vs Desktop</h2>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                                >
                                    <X size={20} className="text-slate-400" />
                                </button>
                            </div>

                            <div className="p-5 space-y-6">
                                {/* Mobile Section */}
                                <div>
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="p-2 bg-blue-100 rounded-xl">
                                            <Smartphone size={18} className="text-blue-600" />
                                        </div>
                                        <h3 className="font-bold text-slate-800">On Mobile</h3>
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
                                        <div className="p-2 bg-amber-100 rounded-xl">
                                            <AlertCircle size={18} className="text-amber-600" />
                                        </div>
                                        <h3 className="font-bold text-slate-800">Desktop Only</h3>
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
                                <div className="bg-blue-50 rounded-2xl p-4">
                                    <h4 className="font-bold text-blue-800 mb-3">💡 Tips for Mobile</h4>
                                    <div className="space-y-2 text-sm text-blue-700">
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
                                <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-4 text-white">
                                    <div className="flex items-center gap-3 mb-2">
                                        <Monitor size={20} />
                                        <span className="font-bold">Want auto-tracking?</span>
                                    </div>
                                    <p className="text-sm text-slate-300">
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
        "flex items-start gap-3 p-3 rounded-xl",
        available ? "bg-green-50" : "bg-slate-50"
    )}>
        <div className={cn(
            "p-1 rounded-lg flex-shrink-0",
            available ? "bg-green-200 text-green-700" : "bg-slate-200 text-slate-500"
        )}>
            {icon}
        </div>
        <div>
            <p className={cn(
                "font-semibold text-sm",
                available ? "text-green-800" : "text-slate-600"
            )}>
                {text}
            </p>
            {reason && (
                <p className="text-xs text-slate-400 mt-0.5">{reason}</p>
            )}
        </div>
    </div>
);

export default MobileHelpButton;
