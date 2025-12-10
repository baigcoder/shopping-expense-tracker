// Add Card Modal - Neo-Brutalist & Gen-Z Vibe 🌟
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, CreditCard, Calendar, Lock, User, Eye, EyeOff, Loader2, Shield, KeyRound, Check, Sparkles, AlertCircle, Wallet } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useModalStore, useCardStore, useAuthStore, detectCardBrand, CardBrand } from '../store/useStore';
import { cardService, CARD_THEMES, getThemeById } from '../services/cardService';
import { toast } from 'react-toastify';
import styles from './AddCardModal.module.css';

const getBrandName = (brand: CardBrand): string => {
    switch (brand) {
        case 'visa': return 'VISA';
        case 'mastercard': return 'MASTERCARD';
        case 'amex': return 'AMEX';
        case 'discover': return 'DISCOVER';
        case 'paypal': return 'PayPal';
        case 'jcb': return 'JCB';
        case 'unionpay': return 'UnionPay';
        default: return 'CARD';
    }
};

// Luhn Algorithm for card validation
const isValidCardNumber = (number: string): boolean => {
    const cleanNumber = number.replace(/\s/g, '');
    if (!/^\d{13,19}$/.test(cleanNumber)) return false;

    let sum = 0;
    let isEven = false;

    for (let i = cleanNumber.length - 1; i >= 0; i--) {
        let digit = parseInt(cleanNumber[i], 10);
        if (isEven) {
            digit *= 2;
            if (digit > 9) digit -= 9;
        }
        sum += digit;
        isEven = !isEven;
    }

    return sum % 10 === 0;
};

// Validate expiry date
const isValidExpiry = (expiry: string): { valid: boolean; error?: string } => {
    if (!/^\d{2}\/\d{2}$/.test(expiry)) {
        return { valid: false, error: 'Use MM/YY' };
    }

    const [month, year] = expiry.split('/').map(Number);
    if (month < 1 || month > 12) return { valid: false, error: 'Invalid month' };

    const currentDate = new Date();
    const currentYear = currentDate.getFullYear() % 100;
    const currentMonth = currentDate.getMonth() + 1;

    if (year < currentYear || (year === currentYear && month < currentMonth)) {
        return { valid: false, error: 'Expired' };
    }

    return { valid: true };
};

// Validate CVV
const isValidCVV = (cvv: string, brand: CardBrand): { valid: boolean; error?: string } => {
    const expectedLength = brand === 'amex' ? 4 : 3;
    if (cvv.length !== expectedLength) {
        return { valid: false, error: `${expectedLength} digits req.` };
    }
    return { valid: true };
};

interface ValidationErrors {
    cardNumber?: string;
    cardHolder?: string;
    expiry?: string;
    cvv?: string;
    pin?: string;
}

const AddCardModal = () => {
    const { isAddCardOpen, closeAddCard } = useModalStore();
    const { addCard, initializeCards } = useCardStore();
    const { user } = useAuthStore();

    const [cardHolder, setCardHolder] = useState('');
    const [cardNumber, setCardNumber] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cvv, setCvv] = useState('');
    const [pin, setPin] = useState('');
    const [selectedTheme, setSelectedTheme] = useState(CARD_THEMES[1].id);
    const [showCvv, setShowCvv] = useState(false);
    const [showPin, setShowPin] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [cardBrand, setCardBrand] = useState<CardBrand>('unknown');
    const [errors, setErrors] = useState<ValidationErrors>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});

    useEffect(() => {
        const brand = detectCardBrand(cardNumber);
        setCardBrand(brand);
    }, [cardNumber]);

    useEffect(() => {
        if (user?.id) initializeCards(user.id);
    }, [user?.id, initializeCards]);

    const currentTheme = getThemeById(selectedTheme);

    const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '');
        const maxLength = cardBrand === 'amex' ? 15 : 16;
        if (value.length > maxLength) return;

        let formatted = '';
        if (cardBrand === 'amex') {
            formatted = value.replace(/(\d{4})(\d{6})?(\d{5})?/, '$1 $2 $3').trim();
        } else {
            formatted = value.replace(/(\d{4})/g, '$1 ').trim();
        }
        setCardNumber(formatted);
        if (touched.cardNumber) validateField('cardNumber', formatted);
    };

    const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 4) return;
        if (value.length >= 2) value = value.slice(0, 2) + '/' + value.slice(2);
        setExpiry(value);
        if (touched.expiry && value.length === 5) validateField('expiry', value);
    };

    const validateField = (field: string, value: string) => {
        const newErrors = { ...errors };
        switch (field) {
            case 'cardNumber':
                if (!value) newErrors.cardNumber = 'Required';
                else if (!isValidCardNumber(value)) newErrors.cardNumber = 'Invalid Number';
                else delete newErrors.cardNumber;
                break;
            case 'cardHolder':
                if (!value) newErrors.cardHolder = 'Required';
                else if (value.length < 2) newErrors.cardHolder = 'Too short';
                else delete newErrors.cardHolder;
                break;
            case 'expiry':
                const r = isValidExpiry(value);
                if (!r.valid) newErrors.expiry = r.error;
                else delete newErrors.expiry;
                break;
            case 'cvv':
                const c = isValidCVV(value, cardBrand);
                if (!c.valid) newErrors.cvv = c.error;
                else delete newErrors.cvv;
                break;
            case 'pin':
                if (!value) newErrors.pin = 'Required';
                else if (value.length < 4) newErrors.pin = '4-6 digits';
                else delete newErrors.pin;
                break;
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleBlur = (field: string, value: string) => {
        setTouched({ ...touched, [field]: true });
        validateField(field, value);
    };

    const validateAll = (): boolean => {
        const newErrors: ValidationErrors = {};
        if (!cardNumber || !isValidCardNumber(cardNumber)) newErrors.cardNumber = 'Invalid/Missing';
        if (!cardHolder || cardHolder.length < 2) newErrors.cardHolder = 'Invalid Name';
        if (!isValidExpiry(expiry).valid) newErrors.expiry = 'Invalid Date';
        if (!isValidCVV(cvv, cardBrand).valid) newErrors.cvv = 'Invalid CVV';
        if (!pin || pin.length < 4) newErrors.pin = 'Invalid PIN';

        setErrors(newErrors);
        setTouched({ cardNumber: true, cardHolder: true, expiry: true, cvv: true, pin: true });
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateAll()) {
            toast.error('Check fields! 🚩');
            return;
        }
        setIsSubmitting(true);
        try {
            const cardData = {
                user_id: user?.id || '',
                type: cardBrand,
                number: cardNumber,
                holder: cardHolder,
                expiry: expiry,
                cvv: cvv,
                pin: pin,
                theme: selectedTheme
            };

            const supabaseData = { ...cardData, card_type: cardBrand };

            if (user?.id) {
                const saved = await cardService.create(supabaseData);
                if (saved) {
                    addCard({ ...cardData, id: saved.id } as any);
                    toast.success('Card added! Secure & Loaded 🔒');
                    // Notify dashboard to refresh cards
                    window.dispatchEvent(new CustomEvent('new-card'));
                } else {
                    addCard(cardData);
                    toast.warning('Saved locally (Sync pending) 💾');
                }
            } else {
                addCard(cardData);
                toast.info('Saved locally 💾');
            }
            resetAndClose();
        } catch (error) {
            console.error(error);
            toast.error('Failed to add card');
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetAndClose = () => {
        setCardNumber(''); setCardHolder(''); setExpiry(''); setCvv(''); setPin('');
        setCardBrand('unknown'); setErrors({}); setTouched({});
        closeAddCard();
    };

    if (!isAddCardOpen) return null;

    return createPortal(
        <AnimatePresence>
            {isAddCardOpen && (
                <motion.div
                    className={styles.overlay}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={resetAndClose}
                >
                    <motion.div
                        className={styles.expandedModal}
                        initial={{ scale: 0.8, opacity: 0, rotate: -5 }}
                        animate={{ scale: 1, opacity: 1, rotate: 0 }}
                        exit={{ scale: 0.8, opacity: 0, rotate: 5 }}
                        transition={{ type: "spring", stiffness: 120, damping: 12 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button className={styles.closeBtnAbsolute} onClick={resetAndClose}>
                            <X size={24} strokeWidth={3} />
                        </button>

                        <div className={styles.splitLayout}>
                            {/* LEFT COLUMN: Visuals */}
                            <div className={styles.leftColumn}>
                                <div className={styles.modalHeader}>
                                    <h2>New Card <Sparkles size={24} fill="#FCD34D" color="#000" /></h2>
                                    <p>Safe • Secure • Vibey</p>
                                </div>

                                <motion.div
                                    className={styles.cardPreviewBig}
                                    style={{ background: currentTheme.gradient }}
                                    layoutId="cardPreview"
                                    whileHover={{ rotate: 1, scale: 1.02 }}
                                >
                                    <div className={styles.cardPattern}></div>
                                    <div className={styles.mascot}>{currentTheme.mascot}</div>

                                    <div className={styles.cardTop}>
                                        <div className={styles.chip}></div>
                                        <div className={styles.brandWrapper}>
                                            <span className={styles.brandName}>{getBrandName(cardBrand)}</span>
                                        </div>
                                    </div>
                                    <div className={styles.cardNumberBig}>
                                        {cardNumber || '0000 0000 0000 0000'}
                                    </div>
                                    <div className={styles.cardBottom}>
                                        <div>
                                            <div className={styles.label}>HOLDER</div>
                                            <div className={styles.val}>{cardHolder || 'YOUR NAME'}</div>
                                        </div>
                                        <div>
                                            <div className={styles.label}>VALID</div>
                                            <div className={styles.val}>{expiry || 'MM/YY'}</div>
                                        </div>
                                    </div>
                                    {/* Quote Display based on Theme */}
                                    {currentTheme.quote && (
                                        <div style={{
                                            position: 'absolute',
                                            bottom: '50%',
                                            right: '0',
                                            left: '0',
                                            textAlign: 'center',
                                            transform: 'translateY(50%)',
                                            fontSize: '1.5rem',
                                            fontWeight: 900,
                                            opacity: 0.15,
                                            pointerEvents: 'none'
                                        }}>
                                            {currentTheme.quote}
                                        </div>
                                    )}
                                </motion.div>

                                <div className={styles.themeSelector}>
                                    <label>Pick a Vibe 🎨</label>
                                    <div className={styles.themeRow}>
                                        {CARD_THEMES.map((theme) => (
                                            <motion.button
                                                key={theme.id}
                                                className={`${styles.themeCircle} ${selectedTheme === theme.id ? styles.activeTheme : ''}`}
                                                style={{ background: theme.gradient }}
                                                onClick={() => setSelectedTheme(theme.id)}
                                                whileHover={{ scale: 1.2 }}
                                                whileTap={{ scale: 0.9 }}
                                            >
                                                {selectedTheme === theme.id && <Check size={20} color="#000" strokeWidth={3} />}
                                            </motion.button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT COLUMN: Form */}
                            <div className={styles.rightColumn}>
                                <form onSubmit={handleSubmit} className={styles.formContent}>
                                    <div className={styles.inputGroup}>
                                        <label>Card Number</label>
                                        <div className={`${styles.inputIconWrapper} ${errors.cardNumber ? styles.inputError : ''}`}>
                                            <CreditCard size={20} className={styles.inputIcon} />
                                            <input
                                                type="text"
                                                className={styles.modernInput}
                                                placeholder="0000 0000 0000 0000"
                                                value={cardNumber}
                                                onChange={handleCardNumberChange}
                                                onBlur={() => handleBlur('cardNumber', cardNumber)}
                                                maxLength={19}
                                                autoFocus
                                            />
                                        </div>
                                        {errors.cardNumber && <span className={styles.errorText}><AlertCircle size={12} />{errors.cardNumber}</span>}
                                    </div>

                                    <div className={styles.inputGroup}>
                                        <label>Card Holder</label>
                                        <div className={`${styles.inputIconWrapper} ${errors.cardHolder ? styles.inputError : ''}`}>
                                            <User size={20} className={styles.inputIcon} />
                                            <input
                                                type="text"
                                                className={styles.modernInput}
                                                placeholder="Name on Card"
                                                value={cardHolder}
                                                onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                                                onBlur={() => handleBlur('cardHolder', cardHolder)}
                                            />
                                        </div>
                                        {errors.cardHolder && <span className={styles.errorText}><AlertCircle size={12} />{errors.cardHolder}</span>}
                                    </div>

                                    <div className={styles.row}>
                                        <div className={styles.inputGroup}>
                                            <label>Expiry</label>
                                            <div className={`${styles.inputIconWrapper} ${errors.expiry ? styles.inputError : ''}`}>
                                                <Calendar size={20} className={styles.inputIcon} />
                                                <input
                                                    type="text"
                                                    className={styles.modernInput}
                                                    placeholder="MM/YY"
                                                    value={expiry}
                                                    onChange={handleExpiryChange}
                                                    onBlur={() => handleBlur('expiry', expiry)}
                                                    maxLength={5}
                                                />
                                            </div>
                                            {errors.expiry && <span className={styles.errorText}><AlertCircle size={12} />{errors.expiry}</span>}
                                        </div>
                                        <div className={styles.inputGroup}>
                                            <label>CVV</label>
                                            <div className={`${styles.inputIconWrapper} ${errors.cvv ? styles.inputError : ''}`}>
                                                <Lock size={20} className={styles.inputIcon} />
                                                <input
                                                    type={showCvv ? "text" : "password"}
                                                    className={styles.modernInput}
                                                    placeholder="123"
                                                    value={cvv}
                                                    onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                                    onBlur={() => handleBlur('cvv', cvv)}
                                                    maxLength={4}
                                                />
                                                <button type="button" className={styles.eyeBtn} onClick={() => setShowCvv(!showCvv)}>
                                                    {showCvv ? <EyeOff size={18} /> : <Eye size={18} />}
                                                </button>
                                            </div>
                                            {errors.cvv && <span className={styles.errorText}><AlertCircle size={12} />{errors.cvv}</span>}
                                        </div>
                                    </div>

                                    <div className={styles.inputGroup}>
                                        <label>Secure PIN <span className={styles.optional}>(For CVV Reveal)</span></label>
                                        <div className={`${styles.inputIconWrapper} ${errors.pin ? styles.inputError : ''}`}>
                                            <KeyRound size={20} className={styles.inputIcon} />
                                            <input
                                                type={showPin ? "text" : "password"}
                                                className={styles.modernInput}
                                                placeholder="****"
                                                value={pin}
                                                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                                onBlur={() => handleBlur('pin', pin)}
                                                maxLength={6}
                                            />
                                            <button type="button" className={styles.eyeBtn} onClick={() => setShowPin(!showPin)}>
                                                {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                        {errors.pin && <span className={styles.errorText}><AlertCircle size={12} />{errors.pin}</span>}
                                    </div>

                                    <div className={styles.spacer}></div>

                                    <button type="submit" className={styles.submitBtnBig} disabled={isSubmitting}>
                                        {isSubmitting ? (
                                            <Loader2 className={styles.spinner} />
                                        ) : (
                                            <>Save Card <Wallet size={20} /></>
                                        )}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default AddCardModal;
