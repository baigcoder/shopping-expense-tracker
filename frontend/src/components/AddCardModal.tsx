// Add Card Modal - Gen Z Expanded Design with Enhanced Validation
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, CreditCard, Calendar, Lock, User, Eye, EyeOff, Loader2, Shield, KeyRound, Check, Sparkles, AlertCircle } from 'lucide-react';
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
        return { valid: false, error: 'Use MM/YY format' };
    }

    const [month, year] = expiry.split('/').map(Number);

    if (month < 1 || month > 12) {
        return { valid: false, error: 'Invalid month (01-12)' };
    }

    const currentDate = new Date();
    const currentYear = currentDate.getFullYear() % 100;
    const currentMonth = currentDate.getMonth() + 1;

    if (year < currentYear || (year === currentYear && month < currentMonth)) {
        return { valid: false, error: 'Card has expired' };
    }

    return { valid: true };
};

// Validate CVV
const isValidCVV = (cvv: string, brand: CardBrand): { valid: boolean; error?: string } => {
    const expectedLength = brand === 'amex' ? 4 : 3;
    if (cvv.length !== expectedLength) {
        return { valid: false, error: `CVV should be ${expectedLength} digits for ${getBrandName(brand)}` };
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

    // Initialize cards when user is available
    useEffect(() => {
        if (user?.id) {
            initializeCards(user.id);
        }
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

        // Validate on change
        if (touched.cardNumber) {
            validateField('cardNumber', formatted);
        }
    };

    const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 4) return;
        if (value.length >= 2) {
            value = value.slice(0, 2) + '/' + value.slice(2);
        }
        setExpiry(value);

        if (touched.expiry && value.length === 5) {
            validateField('expiry', value);
        }
    };

    const validateField = (field: string, value: string) => {
        const newErrors = { ...errors };

        switch (field) {
            case 'cardNumber':
                if (!value) {
                    newErrors.cardNumber = 'Card number is required';
                } else if (!isValidCardNumber(value)) {
                    newErrors.cardNumber = 'Invalid card number';
                } else {
                    delete newErrors.cardNumber;
                }
                break;
            case 'cardHolder':
                if (!value) {
                    newErrors.cardHolder = 'Cardholder name is required';
                } else if (value.length < 2) {
                    newErrors.cardHolder = 'Name too short';
                } else {
                    delete newErrors.cardHolder;
                }
                break;
            case 'expiry':
                const expiryResult = isValidExpiry(value);
                if (!expiryResult.valid) {
                    newErrors.expiry = expiryResult.error;
                } else {
                    delete newErrors.expiry;
                }
                break;
            case 'cvv':
                const cvvResult = isValidCVV(value, cardBrand);
                if (!cvvResult.valid) {
                    newErrors.cvv = cvvResult.error;
                } else {
                    delete newErrors.cvv;
                }
                break;
            case 'pin':
                if (!value) {
                    newErrors.pin = 'PIN is required';
                } else if (value.length < 4) {
                    newErrors.pin = 'PIN must be 4-6 digits';
                } else {
                    delete newErrors.pin;
                }
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

        // Card number
        if (!cardNumber) {
            newErrors.cardNumber = 'Card number is required';
        } else if (!isValidCardNumber(cardNumber)) {
            newErrors.cardNumber = 'Invalid card number (check digits)';
        }

        // Holder
        if (!cardHolder) {
            newErrors.cardHolder = 'Cardholder name is required';
        } else if (cardHolder.length < 2) {
            newErrors.cardHolder = 'Name too short';
        }

        // Expiry
        if (!expiry) {
            newErrors.expiry = 'Expiry date is required';
        } else {
            const expiryResult = isValidExpiry(expiry);
            if (!expiryResult.valid) {
                newErrors.expiry = expiryResult.error;
            }
        }

        // CVV
        if (!cvv) {
            newErrors.cvv = 'CVV is required';
        } else {
            const cvvResult = isValidCVV(cvv, cardBrand);
            if (!cvvResult.valid) {
                newErrors.cvv = cvvResult.error;
            }
        }

        // PIN
        if (!pin) {
            newErrors.pin = 'PIN is required';
        } else if (pin.length < 4) {
            newErrors.pin = 'PIN must be 4-6 digits';
        }

        setErrors(newErrors);
        setTouched({ cardNumber: true, cardHolder: true, expiry: true, cvv: true, pin: true });

        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateAll()) {
            toast.error('Please fix the errors before saving 🔍');
            return;
        }

        setIsSubmitting(true);

        try {
            // Prepare card data for Supabase (using correct field names)
            const supabaseCardData = {
                user_id: user?.id || '',
                card_type: cardBrand, // Supabase uses 'card_type' not 'type'
                number: cardNumber,
                holder: cardHolder,
                expiry: expiry,
                cvv: cvv,
                pin: pin,
                theme: selectedTheme
            };

            // Local store format
            const localCardData = {
                user_id: user?.id || '',
                type: cardBrand,
                number: cardNumber,
                holder: cardHolder,
                expiry: expiry,
                cvv: cvv,
                pin: pin,
                theme: selectedTheme
            };

            if (user?.id) {
                // Try to save to Supabase first
                const savedCard = await cardService.create(supabaseCardData);

                if (savedCard) {
                    // Add to local store with Supabase-generated ID
                    addCard({
                        ...localCardData,
                        id: savedCard.id
                    } as any);
                    toast.success('Card saved securely! 🔒✅', {
                        icon: () => <span>💳</span>
                    });
                } else {
                    // Fallback to local storage only
                    addCard(localCardData);
                    toast.warning('Saved locally (sync failed) 💾', {
                        icon: () => <span>⚠️</span>
                    });
                }
            } else {
                addCard(localCardData);
                toast.info('Card saved locally! Log in to sync. 💾');
            }

            resetAndClose();
        } catch (error) {
            console.error('Error saving card:', error);
            toast.error('Failed to save card. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetAndClose = () => {
        setCardNumber('');
        setCardHolder('');
        setExpiry('');
        setCvv('');
        setPin('');
        setCardBrand('unknown');
        setErrors({});
        setTouched({});
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
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        transition={{ type: "spring", stiffness: 100 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button className={styles.closeBtnAbsolute} onClick={resetAndClose}>
                            <X size={20} />
                        </button>

                        <div className={styles.splitLayout}>
                            {/* LEFT COLUMN: Visuals */}
                            <div className={styles.leftColumn} style={{ background: currentTheme.accent + '20' }}>
                                <motion.div className={styles.modalHeader}>
                                    <h2>New Card <Sparkles size={24} fill="#FFD700" color="#000" /></h2>
                                    <p>Add your payment card securely</p>
                                </motion.div>

                                <motion.div
                                    className={styles.cardPreviewBig}
                                    style={{ background: currentTheme.gradient }}
                                    layoutId="cardPreview"
                                >
                                    <div className={styles.cardPattern} data-pattern={currentTheme.pattern}></div>
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
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                            >
                                                {selectedTheme === theme.id && <Check size={14} color="#fff" />}
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
                                        <div className={`${styles.inputIconWrapper} ${errors.cardNumber && touched.cardNumber ? styles.inputError : ''}`}>
                                            <CreditCard size={18} className={styles.inputIcon} />
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
                                        {errors.cardNumber && touched.cardNumber && (
                                            <span className={styles.errorText}>
                                                <AlertCircle size={12} /> {errors.cardNumber}
                                            </span>
                                        )}
                                    </div>

                                    <div className={styles.inputGroup}>
                                        <label>Card Holder</label>
                                        <div className={`${styles.inputIconWrapper} ${errors.cardHolder && touched.cardHolder ? styles.inputError : ''}`}>
                                            <User size={18} className={styles.inputIcon} />
                                            <input
                                                type="text"
                                                className={styles.modernInput}
                                                placeholder="Name on Card"
                                                value={cardHolder}
                                                onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                                                onBlur={() => handleBlur('cardHolder', cardHolder)}
                                            />
                                        </div>
                                        {errors.cardHolder && touched.cardHolder && (
                                            <span className={styles.errorText}>
                                                <AlertCircle size={12} /> {errors.cardHolder}
                                            </span>
                                        )}
                                    </div>

                                    <div className={styles.row}>
                                        <div className={styles.inputGroup}>
                                            <label>Expiry</label>
                                            <div className={`${styles.inputIconWrapper} ${errors.expiry && touched.expiry ? styles.inputError : ''}`}>
                                                <Calendar size={18} className={styles.inputIcon} />
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
                                            {errors.expiry && touched.expiry && (
                                                <span className={styles.errorText}>
                                                    <AlertCircle size={12} /> {errors.expiry}
                                                </span>
                                            )}
                                        </div>
                                        <div className={styles.inputGroup}>
                                            <label>CVV</label>
                                            <div className={`${styles.inputIconWrapper} ${errors.cvv && touched.cvv ? styles.inputError : ''}`}>
                                                <Lock size={18} className={styles.inputIcon} />
                                                <input
                                                    type={showCvv ? "text" : "password"}
                                                    className={styles.modernInput}
                                                    placeholder={cardBrand === 'amex' ? '1234' : '123'}
                                                    value={cvv}
                                                    onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                                    onBlur={() => handleBlur('cvv', cvv)}
                                                    maxLength={4}
                                                />
                                                <button
                                                    type="button"
                                                    className={styles.eyeBtn}
                                                    onClick={() => setShowCvv(!showCvv)}
                                                >
                                                    {showCvv ? <EyeOff size={16} /> : <Eye size={16} />}
                                                </button>
                                            </div>
                                            {errors.cvv && touched.cvv && (
                                                <span className={styles.errorText}>
                                                    <AlertCircle size={12} /> {errors.cvv}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className={styles.inputGroup}>
                                        <label>Secure PIN <span className={styles.optional}>(For CVV Reveal)</span></label>
                                        <div className={`${styles.inputIconWrapper} ${errors.pin && touched.pin ? styles.inputError : ''}`}>
                                            <KeyRound size={18} className={styles.inputIcon} />
                                            <input
                                                type={showPin ? "text" : "password"}
                                                className={styles.modernInput}
                                                placeholder="4-6 Digits"
                                                value={pin}
                                                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                                onBlur={() => handleBlur('pin', pin)}
                                                maxLength={6}
                                            />
                                            <button
                                                type="button"
                                                className={styles.eyeBtn}
                                                onClick={() => setShowPin(!showPin)}
                                            >
                                                {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                        {errors.pin && touched.pin && (
                                            <span className={styles.errorText}>
                                                <AlertCircle size={12} /> {errors.pin}
                                            </span>
                                        )}
                                    </div>

                                    <div className={styles.spacer}></div>

                                    <button type="submit" className={styles.submitBtnBig} disabled={isSubmitting}>
                                        {isSubmitting ? (
                                            <Loader2 className={styles.spinner} />
                                        ) : (
                                            <>Save Card <Shield size={18} /></>
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
