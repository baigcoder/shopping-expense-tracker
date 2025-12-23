import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, CreditCard, Trash2, Eye, Shield, Smartphone, X, Clock, Lock, Copy, Landmark, Building2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card as UICard, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useCardStore, useModalStore, useAuthStore, Card, CardBrand } from '../store/useStore';
import { cardService, getBrandGradient, getThemeById } from '../services/cardService';
import { toast } from 'sonner';
import LoadingScreen from '../components/LoadingScreen';
import { cn } from '@/lib/utils';
import { useSound } from '@/hooks/useSound';
import LinkedAccountsCard from '../components/LinkedAccountsCard';

// Card Brand Logos (SVG Components)
const VisaLogo = () => (
    <svg viewBox="0 0 80 26" className="h-6 w-auto">
        <text x="0" y="22" fill="#fff" fontSize="22" fontWeight="800" fontFamily="Arial, sans-serif" fontStyle="italic">VISA</text>
    </svg>
);

const MastercardLogo = () => (
    <svg viewBox="0 0 60 40" className="h-6 w-auto">
        <circle cx="20" cy="20" r="18" fill="#EB001B" />
        <circle cx="40" cy="20" r="18" fill="#F79E1B" />
        <path d="M30 7a18 18 0 0 0 0 26" fill="#FF5F00" />
    </svg>
);

const AmexLogo = () => (
    <svg viewBox="0 0 80 26" className="h-6 w-auto">
        <rect width="80" height="26" rx="4" fill="rgba(255,255,255,0.2)" />
        <text x="8" y="18" fill="#fff" fontSize="14" fontWeight="700" fontFamily="Arial, sans-serif">AMEX</text>
    </svg>
);

const GenericLogo = () => (
    <svg viewBox="0 0 60 26" className="h-6 w-auto">
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

const CardsPage = () => {
    const { cards, initializeCards, removeCard, isLoading: cardsLoading } = useCardStore();
    const { openAddCard } = useModalStore();
    const { user } = useAuthStore();
    const sound = useSound();

    // State
    const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
    const [isPinModalOpen, setIsPinModalOpen] = useState(false);
    const [pin, setPin] = useState(['', '', '', '']);
    const [pinError, setPinError] = useState(false);
    const [viewingCard, setViewingCard] = useState<Card | null>(null);
    const [isCVVRevealed, setIsCVVRevealed] = useState(false);
    const [cvvExpiresAt, setCvvExpiresAt] = useState<number | undefined>(undefined);
    const [timeLeft, setTimeLeft] = useState(0);

    useEffect(() => {
        if (user?.id) {
            initializeCards(user.id);
        }
    }, [user?.id, initializeCards]);

    // CVV Timer
    useEffect(() => {
        if (!isCVVRevealed || !cvvExpiresAt) return;

        const interval = setInterval(() => {
            const now = Date.now();
            const remaining = Math.max(0, Math.ceil((cvvExpiresAt - now) / 1000));
            setTimeLeft(remaining);

            if (remaining === 0) {
                setIsCVVRevealed(false);
                setCvvExpiresAt(undefined);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [isCVVRevealed, cvvExpiresAt]);

    const handleCardClick = (card: Card) => {
        setSelectedCardId(card.id);
        setIsPinModalOpen(true);
        setPin(['', '', '', '']);
        setPinError(false);
    };

    const handlePinChange = (index: number, value: string) => {
        if (value.length > 1) return;
        const newPin = [...pin];
        newPin[index] = value;
        setPin(newPin);
        setPinError(false);

        if (value && index < 3) {
            document.getElementById(`pin-${index + 1}`)?.focus();
        }
    };

    const handleVerifyPin = async () => {
        const enteredPin = pin.join('');
        if (enteredPin === '1234') {
            const card = cards.find(c => c.id === selectedCardId);
            if (card) {
                setViewingCard(card);
                setIsPinModalOpen(false);
                sound.playSuccess();
            }
        } else {
            setPinError(true);
            toast.error('Incorrect PIN');
            setPin(['', '', '', '']);
            document.getElementById('pin-0')?.focus();
            sound.playError();
        }
    };

    const handleRevealCVV = () => {
        setIsCVVRevealed(true);
        setCvvExpiresAt(Date.now() + 30000);
        sound.playClick();
    };

    const handleDeleteCard = async () => {
        if (!viewingCard) return;
        if (confirm('Are you sure you want to delete this card?')) {
            removeCard(viewingCard.id);
            setViewingCard(null);
            toast.success('Card deleted successfully');
            sound.playSuccess();
        }
    };

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('Copied to clipboard');
        sound.playClick();
    };

    if (cardsLoading && cards.length === 0) return <LoadingScreen />;

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-10 bg-[#FAFBFF] min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 shadow-xl shadow-blue-200 ring-4 ring-blue-50">
                        <CreditCard className="h-8 w-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tight font-display">My Cards</h1>
                        <p className="text-slate-500 font-bold flex items-center gap-2">
                            Manage your physical and virtual cards
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-50 text-[10px] font-black text-blue-600 border border-blue-100 uppercase tracking-wider">
                                Secure
                            </span>
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        className="h-12 px-6 rounded-2xl border-slate-200 bg-white text-slate-600 font-bold hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
                        onClick={() => initializeCards(user?.id || '')}
                    >
                        <Clock className="mr-2 h-4 w-4" />
                        Refresh
                    </Button>
                    <Button
                        onClick={openAddCard}
                        className="h-12 px-8 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black shadow-xl shadow-blue-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <Plus className="mr-2 h-5 w-5" />
                        Add New Card
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div
                    whileHover={{ y: -5 }}
                    className="p-6 rounded-[2rem] bg-white border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden group"
                >
                    <div className="absolute top-0 right-0 p-8 -tr-y-1/2 tr-x-1/2 bg-blue-50 rounded-full blur-3xl opacity-50 group-hover:opacity-80 transition-opacity" />
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 rounded-2xl bg-blue-50 text-blue-600">
                                <CreditCard className="h-6 w-6" />
                            </div>
                            <span className="text-[10px] font-black text-blue-500 bg-blue-50/50 px-2 py-1 rounded-lg uppercase tracking-wider border border-blue-100/50">
                                Active
                            </span>
                        </div>
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-1">Active Cards</h3>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-black text-slate-800 tracking-tighter">{cards.length}</span>
                            <span className="text-xs font-bold text-slate-400">Total Cards</span>
                        </div>
                        <div className="mt-4 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(100, (cards.length / 5) * 100)}%` }}
                                className="h-full bg-blue-600 rounded-full shadow-[0_0_10px_rgba(37,99,235,0.4)]"
                            />
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    whileHover={{ y: -5 }}
                    className="p-6 rounded-[2rem] bg-white border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden group"
                >
                    <div className="absolute top-0 right-0 p-8 -tr-y-1/2 tr-x-1/2 bg-indigo-50 rounded-full blur-3xl opacity-50 group-hover:opacity-80 transition-opacity" />
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600">
                                <Shield className="h-6 w-6" />
                            </div>
                            <span className="text-[10px] font-black text-indigo-500 bg-indigo-50/50 px-2 py-1 rounded-lg uppercase tracking-wider border border-indigo-100/50">
                                Protected
                            </span>
                        </div>
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-1">Security Status</h3>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-black text-indigo-600 tracking-tighter">100%</span>
                            <span className="text-xs font-bold text-slate-400">Secured</span>
                        </div>
                        <div className="mt-4 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full w-full bg-indigo-600 rounded-full shadow-[0_0_10px_rgba(79,70,229,0.4)]" />
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    whileHover={{ y: -5 }}
                    className="p-6 rounded-[2rem] bg-white border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden group"
                >
                    <div className="absolute top-0 right-0 p-8 -tr-y-1/2 tr-x-1/2 bg-emerald-50 rounded-full blur-3xl opacity-50 group-hover:opacity-80 transition-opacity" />
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600">
                                <Landmark className="h-6 w-6" />
                            </div>
                            <span className="text-[10px] font-black text-emerald-500 bg-emerald-50/50 px-2 py-1 rounded-lg uppercase tracking-wider border border-emerald-100/50">
                                Connected
                            </span>
                        </div>
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-1">Linked Hub</h3>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-black text-slate-800 tracking-tighter">Ready</span>
                            <span className="text-xs font-bold text-slate-400">Digital Pay</span>
                        </div>
                        <div className="mt-4 flex items-center gap-1">
                            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-black text-emerald-600 tracking-tighter uppercase">Systems Operational</span>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Connected Banks Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/30 overflow-hidden"
            >
                <div className="p-8 border-b border-slate-50 bg-gradient-to-r from-slate-50 to-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-2xl bg-emerald-100 text-emerald-600">
                                <Building2 className="h-6 w-6" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Connected Banks</h2>
                                <p className="text-sm text-slate-500 font-bold">Manage your external financial connections</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="p-6">
                    <LinkedAccountsCard />
                </div>
            </motion.div>

            {/* Cards Grid Section */}
            <div className="space-y-6 pt-6">
                <div className="flex items-center justify-between px-2">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Your Digital Wallet</h2>
                        <p className="text-sm text-slate-500 font-bold">{cards.length} cards securely stored</p>
                    </div>
                    <div className="h-px flex-1 bg-slate-100 mx-8 hidden md:block" />
                    <div className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-wider">
                        <Shield className="h-3 w-3" />
                        Encrypted
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {/* Add Card Button Card */}
                    <motion.button
                        whileHover={{ scale: 1.02, y: -5 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={openAddCard}
                        className="aspect-[1.586/1] rounded-[2rem] border-4 border-dashed border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all flex flex-col items-center justify-center gap-4 group bg-slate-50/50"
                    >
                        <div className="p-5 rounded-2xl bg-white shadow-sm group-hover:shadow-md transition-all">
                            <Plus className="h-8 w-8 text-slate-300 group-hover:text-blue-500 transition-colors" />
                        </div>
                        <span className="text-sm font-black text-slate-400 group-hover:text-blue-600 transition-colors uppercase tracking-widest">
                            Issue New Card
                        </span>
                    </motion.button>

                    {/* Cards */}
                    {cards.map((card, index) => (
                        <motion.div
                            key={card.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            onClick={() => handleCardClick(card)}
                            className="aspect-[1.586/1] rounded-[2rem] cursor-pointer relative overflow-hidden group shadow-2xl shadow-slate-300/40"
                            style={{ background: getCardGradient(card) }}
                        >
                            {/* Premium Glass/Shine Effects */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-60" />
                            <div className="absolute -inset-[100%] bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12 group-hover:translate-x-[200%] transition-transform duration-1000 ease-in-out" />

                            {/* Card Decorative Rings */}
                            <div className="absolute -top-20 -right-20 w-64 h-64 border-[32px] border-white/5 rounded-full" />
                            <div className="absolute -bottom-10 -left-10 w-32 h-32 border-[16px] border-white/5 rounded-full" />

                            {/* Card Content */}
                            <div className="relative h-full p-8 flex flex-col justify-between text-white">
                                {/* Top Layout */}
                                <div className="flex items-start justify-between">
                                    <div className="flex flex-col gap-1">
                                        <div className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Digital Asset</div>
                                        <div className="font-display font-black text-lg tracking-tight">Active Plan</div>
                                    </div>
                                    <div className="drop-shadow-lg">{getBrandLogo(card.type)}</div>
                                </div>

                                {/* Center - Chip & Signal */}
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-14 rounded-lg bg-gradient-to-br from-amber-200 via-amber-300 to-amber-200 shadow-inner overflow-hidden relative">
                                        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-20">
                                            {[...Array(9)].map((_, i) => (
                                                <div key={i} className="border-[0.5px] border-black/40" />
                                            ))}
                                        </div>
                                    </div>
                                    <svg viewBox="0 0 24 24" className="h-6 w-6 text-white/40 rotate-90">
                                        <path fill="currentColor" d="M11.5 12a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm0 5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm0-10a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z" />
                                    </svg>
                                </div>

                                {/* Bottom - Info */}
                                <div className="space-y-4">
                                    <div className="text-xl md:text-2xl font-mono tracking-[0.2em] font-bold drop-shadow-md">
                                        {card.number ? `•••• •••• •••• ${card.number.slice(-4)}` : '•••• •••• •••• ••••'}
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <div className="space-y-1">
                                            <div className="text-[9px] font-black opacity-60 uppercase tracking-widest">Card Holder</div>
                                            <div className="text-sm font-black tracking-wide uppercase">{card.holder || 'YOUR NAME'}</div>
                                        </div>
                                        <div className="space-y-1 text-right">
                                            <div className="text-[9px] font-black opacity-60 uppercase tracking-widest">Expires</div>
                                            <div className="text-sm font-black tracking-wide">{card.expiry || 'MM/YY'}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* PIN Verification Modal */}
            <Dialog open={isPinModalOpen} onOpenChange={setIsPinModalOpen}>
                <DialogContent className="sm:max-w-md p-0 overflow-hidden border-none rounded-[2.5rem] shadow-2xl">
                    <div className="relative overflow-hidden pt-10 pb-6 px-6 bg-slate-50 text-center">
                        <div className="absolute top-0 right-0 -tr-y-1/2 tr-x-1/2 w-48 h-48 bg-blue-100/50 rounded-full blur-3xl -z-10" />

                        <div className="flex flex-col items-center gap-4 relative z-10">
                            <div className="h-20 w-20 rounded-3xl bg-blue-600 shadow-xl shadow-blue-200 flex items-center justify-center rotate-3 hover:rotate-0 transition-transform duration-500">
                                <Lock className="h-10 w-10 text-white" />
                            </div>
                            <div>
                                <DialogTitle className="text-2xl font-black text-slate-800 tracking-tight">Security Verification</DialogTitle>
                                <DialogDescription className="text-slate-500 font-bold mt-1">
                                    Enter your 4-digit PIN to access card details
                                </DialogDescription>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 space-y-8 bg-white">
                        <div className="flex justify-center gap-4">
                            {pin.map((digit, index) => (
                                <Input
                                    key={index}
                                    id={`pin-${index}`}
                                    type="password"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handlePinChange(index, e.target.value)}
                                    className={cn(
                                        "w-14 h-16 text-center text-3xl font-black rounded-2xl border-2 transition-all duration-300",
                                        pinError
                                            ? "border-red-500 bg-red-50 text-red-600 animate-shake"
                                            : "border-slate-100 bg-slate-50 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
                                    )}
                                />
                            ))}
                        </div>

                        <div className="flex flex-col gap-3">
                            <Button
                                className="h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black shadow-lg shadow-blue-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                onClick={handleVerifyPin}
                                disabled={pin.join('').length < 4}
                            >
                                Verify Identity
                            </Button>
                            <Button
                                variant="ghost"
                                className="h-12 rounded-xl text-slate-400 font-bold hover:text-slate-600 hover:bg-slate-50"
                                onClick={() => setIsPinModalOpen(false)}
                            >
                                Cancel
                            </Button>
                        </div>

                        <p className="text-center text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                            <Shield className="h-3 w-3 inline mr-1" />
                            Bank-Grade Encryption Active
                        </p>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Card Details Modal */}
            <Dialog open={!!viewingCard} onOpenChange={() => setViewingCard(null)}>
                <DialogContent className="sm:max-w-xl p-0 overflow-hidden border-none rounded-[3rem] shadow-2xl">
                    <div className="relative overflow-hidden pt-8 pb-6 px-8 bg-slate-50">
                        <div className="absolute top-0 right-0 -tr-y-1/2 tr-x-1/2 w-64 h-64 bg-blue-100/30 rounded-full blur-3xl -z-10" />

                        <div className="relative z-10 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-2xl bg-blue-600 shadow-lg shadow-blue-100">
                                    <Shield className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <DialogTitle className="text-2xl font-black text-slate-800 tracking-tight">Vault Management</DialogTitle>
                                    <DialogDescription className="text-slate-500 font-bold">Securely view and manage your card</DialogDescription>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-full hover:bg-slate-200"
                                onClick={() => setViewingCard(null)}
                            >
                                <X className="h-5 w-5 text-slate-500" />
                            </Button>
                        </div>
                    </div>

                    {viewingCard && (
                        <div className="p-8 space-y-8 bg-white">
                            {/* Card Visual Large */}
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="aspect-[1.586/1] rounded-[2.5rem] p-8 flex flex-col justify-between text-white relative overflow-hidden shadow-2xl shadow-blue-200/50"
                                style={{ background: getCardGradient(viewingCard) }}
                            >
                                <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent" />
                                <div className="relative flex items-start justify-between">
                                    <div className="h-14 w-20 rounded-xl bg-gradient-to-br from-amber-200 via-amber-300 to-amber-200 shadow-inner" />
                                    <div className="scale-125 drop-shadow-xl">{getBrandLogo(viewingCard.type)}</div>
                                </div>
                                <div className="relative">
                                    <div className="text-2xl md:text-3xl font-mono tracking-[0.25em] font-black mb-6 drop-shadow-lg">
                                        {viewingCard.number ? `•••• •••• •••• ${viewingCard.number.slice(-4)}` : '•••• •••• •••• ••••'}
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <div className="space-y-1">
                                            <div className="text-[10px] font-black opacity-60 uppercase tracking-widest">Card Holder</div>
                                            <div className="text-lg font-black tracking-wide uppercase">{viewingCard.holder || 'YOUR NAME'}</div>
                                        </div>
                                        <div className="space-y-1 text-right">
                                            <div className="text-[10px] font-black opacity-60 uppercase tracking-widest">Expires</div>
                                            <div className="text-lg font-black tracking-wide">{viewingCard.expiry || 'MM/YY'}</div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-1 gap-4">
                                <div className="group flex items-center justify-between p-4 rounded-2xl border-2 border-slate-50 bg-slate-50/30 hover:bg-white hover:border-blue-100 transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-xl bg-blue-100 text-blue-600">
                                            <CreditCard className="h-5 w-5" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Number</span>
                                            <code className="text-sm font-black text-slate-700 tracking-wider">•••• •••• •••• {viewingCard.number?.slice(-4)}</code>
                                        </div>
                                    </div>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="rounded-xl hover:bg-blue-50 hover:text-blue-600"
                                        onClick={() => handleCopy(viewingCard.number || '')}
                                    >
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>

                                <div className="group flex items-center justify-between p-4 rounded-2xl border-2 border-slate-50 bg-slate-50/30 hover:bg-white hover:border-blue-100 transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-xl bg-indigo-100 text-indigo-600">
                                            <Lock className="h-5 w-5" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Secure CVV</span>
                                            {isCVVRevealed ? (
                                                <div className="flex items-center gap-2">
                                                    <code className="text-lg font-black text-slate-800 tracking-widest">{viewingCard.cvv || '123'}</code>
                                                    <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                                                        Expires in {timeLeft}s
                                                    </span>
                                                </div>
                                            ) : (
                                                <code className="text-lg font-black text-slate-300 tracking-widest">•••</code>
                                            )}
                                        </div>
                                    </div>
                                    {!isCVVRevealed && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="rounded-xl border-slate-200 font-bold hover:bg-blue-50 hover:border-blue-100 hover:text-blue-600"
                                            onClick={handleRevealCVV}
                                        >
                                            <Eye className="h-4 w-4 mr-2" />
                                            Reveal
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {/* Actions Area */}
                            <div className="flex gap-4 pt-4">
                                <Button
                                    className="flex-1 h-14 rounded-2xl bg-slate-900 hover:bg-black text-white font-black shadow-xl shadow-slate-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                    onClick={() => handleCopy(viewingCard.number || '')}
                                >
                                    <Copy className="h-5 w-5 mr-3" />
                                    Copy Number
                                </Button>
                                <Button
                                    variant="outline"
                                    className="h-14 w-14 rounded-2xl border-2 border-red-50 text-red-100 hover:text-red-500 hover:bg-red-50 hover:border-red-100 transition-all"
                                    onClick={handleDeleteCard}
                                >
                                    <Trash2 className="h-6 w-6" />
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default CardsPage;

