// Add Card Modal - Premium SaaS Redesign
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, CreditCard, Calendar, Lock, User, Eye, EyeOff, Loader2, Wallet, Check, AlertCircle, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useModalStore, useCardStore, useAuthStore, detectCardBrand, CardBrand } from '../store/useStore';
import { cardService, CARD_THEMES } from '../services/cardService';
import { notificationTriggers } from '../services/notificationService';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PremiumCard from './PremiumCard';
import { cn } from '@/lib/utils';



const getBrandName = (brand: CardBrand): string => {
    switch (brand) {
        case 'visa': return 'VISA';
        case 'mastercard': return 'MASTERCARD';
        case 'amex': return 'AMEX';
        case 'discover': return 'DISCOVER';
        case 'paypal': return 'PayPal';
        default: return 'CARD';
    }
};

// ... Validation Helpers ...
const isValidCardNumber = (number: string) => {
    const clean = number.replace(/\s/g, '');
    return /^\d{13,19}$/.test(clean); // Simplified for UI feedback, backend does strict
};

const isValidExpiry = (expiry: string) => {
    if (!/^\d{2}\/\d{2}$/.test(expiry)) return { valid: false, error: 'Use MM/YY' };
    const [m, y] = expiry.split('/').map(Number);
    if (m < 1 || m > 12) return { valid: false, error: 'Invalid month' };
    return { valid: true };
};

const isValidCVV = (cvv: string, brand: CardBrand) => {
    const len = brand === 'amex' ? 4 : 3;
    return { valid: cvv.length === len, error: `${len} digits` };
};

const AddCardModal = () => {
    const { isAddCardOpen, closeAddCard } = useModalStore();
    const { addCard, initializeCards } = useCardStore();
    const { user } = useAuthStore();

    const [cardHolder, setCardHolder] = useState('');
    const [cardNumber, setCardNumber] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cvv, setCvv] = useState('');
    const [pin, setPin] = useState('');
    const [selectedTheme, setSelectedTheme] = useState(CARD_THEMES[0].id);
    const [showCvv, setShowCvv] = useState(false);
    const [showPin, setShowPin] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [cardBrand, setCardBrand] = useState<CardBrand>('unknown');
    const [errors, setErrors] = useState<any>({});
    const [touched, setTouched] = useState<any>({});

    useEffect(() => {
        setCardBrand(detectCardBrand(cardNumber));
    }, [cardNumber]);

    const currentTheme = CARD_THEMES.find(t => t.id === selectedTheme) || CARD_THEMES[0];

    // Handlers (Simplified for brevity, same logic as before but cleaner)
    const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value.replace(/\D/g, '');
        if (val.length > 19) return;

        let formatted = '';
        if (cardBrand === 'amex') formatted = val.replace(/(\d{4})(\d{6})?(\d{5})?/, '$1 $2 $3').trim();
        else formatted = val.replace(/(\d{4})/g, '$1 ').trim();

        setCardNumber(formatted);
        if (touched.cardNumber) validate('cardNumber', formatted);
    };

    const validate = (field: string, val: string) => {
        let errs = { ...errors };
        if (field === 'cardNumber' && !isValidCardNumber(val)) errs.cardNumber = 'Invalid number';
        else delete errs.cardNumber;
        setErrors(errs);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const cardData = {
                user_id: user?.id || '',
                number: cardNumber,
                holder: cardHolder,
                expiry: expiry,
                cvv: cvv,
                pin: pin,
                theme: selectedTheme,
                card_type: cardBrand
            };

            // Call Service
            if (user?.id) {
                const savedCard = await cardService.create(cardData);
                if (savedCard) {
                    // Add the saved card with proper Supabase ID to store
                    addCard({
                        ...savedCard,
                        type: savedCard.card_type || cardBrand
                    } as any);
                    toast.success('Card added successfully');
                } else {
                    throw new Error('Failed to save card');
                }
            }

            closeAddCard();
        } catch (e) {
            toast.error('Failed to add card');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isAddCardOpen) return null;

    return createPortal(
        <AnimatePresence>
            {isAddCardOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                        onClick={closeAddCard}
                    />

                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.95 }}
                        className="relative w-full max-w-5xl bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Left Column: Visuals & Preview */}
                        <div className="w-full md:w-[45%] bg-[#FAFBFF] p-8 md:p-12 flex flex-col justify-between border-r border-slate-100">
                            <div>
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 shadow-xl shadow-blue-200 ring-4 ring-blue-50">
                                        <Wallet className="h-6 w-6 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-black text-slate-800 tracking-tight font-display">New Card</h2>
                                        <p className="text-slate-500 font-bold">Configure your digital asset</p>
                                    </div>
                                </div>

                                <PremiumCard
                                    card={{
                                        id: 'preview',
                                        user_id: user?.id || '',
                                        number: cardNumber,
                                        holder: cardHolder,
                                        expiry: expiry,
                                        cvv: cvv,
                                        pin: pin,
                                        type: cardBrand,
                                        theme: selectedTheme
                                    }}
                                    showFullNumber={true}
                                    className="shadow-2xl shadow-blue-200/50"
                                />

                                <div className="mt-12 space-y-4">
                                    <div className="flex justify-between items-center px-1">
                                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Select Card Aura</span>
                                        <div className="h-px w-20 bg-slate-100" />
                                    </div>
                                    <div className="flex flex-wrap gap-4">
                                        {CARD_THEMES.map(t => (
                                            <button
                                                key={t.id}
                                                className={cn(
                                                    "w-12 h-12 rounded-2xl p-0.5 transition-all duration-300 transform active:scale-90",
                                                    selectedTheme === t.id ? "ring-4 ring-blue-100 ring-offset-2 scale-110 shadow-lg" : "hover:scale-105"
                                                )}
                                                onClick={() => setSelectedTheme(t.id)}
                                            >
                                                <div
                                                    className="w-full h-full rounded-xl flex items-center justify-center shadow-inner"
                                                    style={{ background: t.gradient }}
                                                >
                                                    {selectedTheme === t.id && <Check className="h-5 w-5 text-white drop-shadow-md" />}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="hidden md:flex items-center gap-3 text-slate-400">
                                <Shield className="h-5 w-5" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Bank-Grade Security</span>
                            </div>
                        </div>

                        {/* Right Column: Form Inputs */}
                        <div className="w-full md:w-[55%] p-8 md:p-12 bg-white overflow-y-auto">
                            <button
                                onClick={closeAddCard}
                                className="absolute right-8 top-8 p-2 rounded-full hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X className="h-6 w-6" />
                            </button>

                            <form onSubmit={handleSubmit} className="space-y-8 mt-4">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">Card Number</label>
                                    <div className="relative group">
                                        <div className="absolute left-5 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-slate-50 text-slate-400 group-focus-within:text-blue-600 group-focus-within:bg-blue-50 transition-all">
                                            <CreditCard className="h-5 w-5" />
                                        </div>
                                        <Input
                                            className="h-16 pl-16 pr-6 rounded-2xl border-2 border-slate-50 bg-slate-50 placeholder:text-slate-300 text-slate-700 font-bold text-lg focus:border-blue-100 focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all shadow-none"
                                            placeholder="0000 0000 0000 0000"
                                            value={cardNumber}
                                            onChange={handleCardNumberChange}
                                            maxLength={19}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">Card Holder</label>
                                    <div className="relative group">
                                        <div className="absolute left-5 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-slate-50 text-slate-400 group-focus-within:text-blue-600 group-focus-within:bg-blue-50 transition-all">
                                            <User className="h-5 w-5" />
                                        </div>
                                        <Input
                                            className="h-16 pl-16 pr-6 rounded-2xl border-2 border-slate-50 bg-slate-50 placeholder:text-slate-300 text-slate-700 font-bold text-lg focus:border-blue-100 focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all shadow-none"
                                            placeholder="NAME ON CARD"
                                            value={cardHolder}
                                            onChange={e => setCardHolder(e.target.value.toUpperCase())}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">Expiry</label>
                                        <div className="relative group">
                                            <div className="absolute left-5 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-slate-50 text-slate-400 group-focus-within:text-blue-600 group-focus-within:bg-blue-50 transition-all">
                                                <Calendar className="h-5 w-5" />
                                            </div>
                                            <Input
                                                className="h-16 pl-16 pr-6 rounded-2xl border-2 border-slate-50 bg-slate-50 placeholder:text-slate-300 text-slate-700 font-bold text-lg focus:border-blue-100 focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all shadow-none"
                                                placeholder="MM/YY"
                                                value={expiry}
                                                onChange={e => {
                                                    let v = e.target.value.replace(/\D/g, '');
                                                    if (v.length >= 2) v = v.slice(0, 2) + '/' + v.slice(2, 4);
                                                    setExpiry(v);
                                                }}
                                                maxLength={5}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">Security Code</label>
                                        <div className="relative group">
                                            <div className="absolute left-5 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-slate-50 text-slate-400 group-focus-within:text-blue-600 group-focus-within:bg-blue-50 transition-all">
                                                <Lock className="h-5 w-5" />
                                            </div>
                                            <Input
                                                type={showCvv ? "text" : "password"}
                                                className="h-16 pl-16 pr-14 rounded-2xl border-2 border-slate-50 bg-slate-50 placeholder:text-slate-300 text-slate-700 font-bold text-lg focus:border-blue-100 focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all shadow-none"
                                                placeholder="CVV"
                                                value={cvv}
                                                onChange={e => setCvv(e.target.value.slice(0, 4))}
                                                maxLength={4}
                                            />
                                            <button
                                                type="button"
                                                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-300 hover:text-blue-600"
                                                onClick={() => setShowCvv(!showCvv)}
                                            >
                                                {showCvv ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full h-16 rounded-3xl bg-blue-600 hover:bg-blue-700 text-white font-black text-lg shadow-2xl shadow-blue-200 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-70"
                                >
                                    {isSubmitting ? (
                                        <Loader2 className="h-6 w-6 animate-spin" />
                                    ) : (
                                        <>
                                            Add Card
                                            <Wallet className="h-5 w-5" />
                                        </>
                                    )}
                                </Button>
                            </form>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default AddCardModal;
