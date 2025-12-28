// CardPreviewModal - Full screen card preview with details
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, CreditCard, Smartphone, Shield, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Card, CardBrand } from '../store/useStore';
import { getThemeById, getBrandGradient } from '../services/cardService';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { soundManager } from '@/lib/sounds';

// Card Brand Logos
const VisaLogo = () => (
    <svg viewBox="0 0 80 26" className="h-8 w-auto">
        <text x="0" y="22" fill="#fff" fontSize="22" fontWeight="800" fontFamily="Arial, sans-serif" fontStyle="italic">VISA</text>
    </svg>
);

const MastercardLogo = () => (
    <svg viewBox="0 0 60 40" className="h-8 w-auto">
        <circle cx="20" cy="20" r="18" fill="#EB001B" />
        <circle cx="40" cy="20" r="18" fill="#F79E1B" />
        <path d="M30 7a18 18 0 0 0 0 26" fill="#FF5F00" />
    </svg>
);

const AmexLogo = () => (
    <svg viewBox="0 0 80 26" className="h-8 w-auto">
        <rect width="80" height="26" rx="4" fill="rgba(255,255,255,0.2)" />
        <text x="8" y="18" fill="#fff" fontSize="14" fontWeight="700" fontFamily="Arial, sans-serif">AMEX</text>
    </svg>
);

const GenericLogo = () => (
    <svg viewBox="0 0 60 26" className="h-8 w-auto">
        <text x="0" y="20" fill="#fff" fontSize="16" fontWeight="700" fontFamily="Arial, sans-serif">BANK</text>
    </svg>
);

const getBrandLogo = (brand: CardBrand) => {
    switch (brand) {
        case 'visa': return <VisaLogo />;
        case 'mastercard': return <MastercardLogo />;
        case 'amex': return <AmexLogo />;
        default: return <GenericLogo />;
    }
};

const getCardGradient = (card: Card): string => {
    if (card.theme) {
        const theme = getThemeById(card.theme);
        return theme.gradient;
    }
    return getBrandGradient(card.type);
};

interface CardPreviewModalProps {
    card: Card | null;
    isOpen: boolean;
    onClose: () => void;
    onDelete?: (cardId: string) => void;
}

const CardPreviewModal = ({ card, isOpen, onClose, onDelete }: CardPreviewModalProps) => {
    const [copied, setCopied] = useState<string | null>(null);

    if (!card) return null;

    const copyToClipboard = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopied(field);
        soundManager.play('click');
        toast.success(`${field} copied!`);
        setTimeout(() => setCopied(null), 2000);
    };

    const handleDelete = () => {
        if (onDelete && card.id) {
            onDelete(card.id);
            onClose();
        }
    };

    const maskedNumber = card.number || `**** **** **** ${card.last4 || '****'}`;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100]"
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed inset-0 z-[101] flex items-center justify-center p-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden">
                            {/* Card Preview */}
                            <div className="p-6 bg-gradient-to-br from-slate-50 to-slate-100">
                                <div className="flex justify-between items-start mb-4">
                                    <h2 className="text-xl font-bold text-slate-800">Card Details</h2>
                                    <button
                                        onClick={onClose}
                                        className="p-2 rounded-xl bg-white shadow-sm hover:bg-slate-50 transition-colors"
                                    >
                                        <X size={20} className="text-slate-500" />
                                    </button>
                                </div>

                                {/* Large Card Display */}
                                <motion.div
                                    className="relative rounded-2xl p-6 aspect-[1.586/1] overflow-hidden"
                                    style={{ background: getCardGradient(card) }}
                                    whileHover={{ scale: 1.02 }}
                                    transition={{ type: 'spring', stiffness: 300 }}
                                >
                                    {/* Shine effect */}
                                    <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-white/5" />

                                    {/* Card Content */}
                                    <div className="relative h-full flex flex-col justify-between">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <span className="text-[10px] uppercase tracking-widest text-white/60 font-bold">Digital Asset</span>
                                                <p className="text-white font-bold text-lg">Elite Status</p>
                                            </div>
                                            {getBrandLogo(card.type)}
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-9 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-md grid grid-cols-3 gap-0.5 p-1.5">
                                                {[...Array(9)].map((_, i) => <div key={i} className="bg-yellow-600/30 rounded-[1px]" />)}
                                            </div>
                                            <Smartphone className="h-6 w-6 text-white/30" strokeWidth={1.5} />
                                        </div>

                                        <div>
                                            <p className="text-white text-2xl font-mono tracking-widest mb-4">
                                                {maskedNumber}
                                            </p>
                                            <div className="flex justify-between">
                                                <div>
                                                    <span className="text-[10px] uppercase tracking-wider text-white/50">Card Holder</span>
                                                    <p className="text-white font-semibold">{card.holder || 'YOUR NAME'}</p>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-[10px] uppercase tracking-wider text-white/50">Expires</span>
                                                    <p className="text-white font-semibold">{card.expiry || 'MM/YY'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>

                            {/* Card Info Actions */}
                            <div className="p-6 space-y-4">
                                {/* Quick Copy Buttons */}
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => copyToClipboard(card.last4 || '****', 'Last 4 digits')}
                                        className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors group"
                                    >
                                        <div className="p-2 bg-white rounded-lg shadow-sm">
                                            <CreditCard size={18} className="text-blue-500" />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-xs text-slate-400 font-medium">Last 4 Digits</p>
                                            <p className="text-slate-700 font-bold">{card.last4 || '****'}</p>
                                        </div>
                                        {copied === 'Last 4 digits' ? (
                                            <Check size={16} className="ml-auto text-green-500" />
                                        ) : (
                                            <Copy size={16} className="ml-auto text-slate-300 group-hover:text-slate-500" />
                                        )}
                                    </button>

                                    <button
                                        onClick={() => copyToClipboard(card.expiry || '', 'Expiry')}
                                        className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors group"
                                    >
                                        <div className="p-2 bg-white rounded-lg shadow-sm">
                                            <Shield size={18} className="text-emerald-500" />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-xs text-slate-400 font-medium">Expiry</p>
                                            <p className="text-slate-700 font-bold">{card.expiry || 'MM/YY'}</p>
                                        </div>
                                        {copied === 'Expiry' ? (
                                            <Check size={16} className="ml-auto text-green-500" />
                                        ) : (
                                            <Copy size={16} className="ml-auto text-slate-300 group-hover:text-slate-500" />
                                        )}
                                    </button>
                                </div>

                                {/* Card Holder */}
                                <div className="p-4 bg-slate-50 rounded-xl">
                                    <p className="text-xs text-slate-400 font-medium mb-1">Card Holder</p>
                                    <p className="text-slate-800 font-bold text-lg">{card.holder || 'Not Set'}</p>
                                </div>

                                {/* Security Notice */}
                                <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                                    <Shield size={20} className="text-emerald-500" />
                                    <div>
                                        <p className="text-emerald-700 font-semibold text-sm">Secure Storage</p>
                                        <p className="text-emerald-600/70 text-xs">Only the last 4 digits are stored. CVV/PIN are never saved.</p>
                                    </div>
                                </div>

                                {/* Delete Button */}
                                {onDelete && (
                                    <button
                                        onClick={handleDelete}
                                        className="w-full flex items-center justify-center gap-2 p-4 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-colors font-semibold"
                                    >
                                        <Trash2 size={18} />
                                        Remove Card
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default CardPreviewModal;
