// Cards Page - Professional Design with Card Details Modal
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, CreditCard, Trash2, Eye, EyeOff, Shield, Zap, Smartphone, X, Clock, Lock, CheckCircle, AlertCircle, Copy, Check } from 'lucide-react';
import { useCardStore, useModalStore, useAuthStore, Card, CardBrand } from '../store/useStore';
import { toast } from 'react-toastify';
import styles from './CardsPage.module.css';

// Card Brand Logos
const VisaLogo = () => (
    <svg viewBox="0 0 80 26" className={styles.brandLogo}>
        <text x="0" y="22" fill="#fff" fontSize="22" fontWeight="800" fontFamily="Arial, sans-serif" fontStyle="italic">VISA</text>
    </svg>
);

const MastercardLogo = () => (
    <svg viewBox="0 0 60 40" className={styles.brandLogo}>
        <circle cx="20" cy="20" r="18" fill="#EB001B" />
        <circle cx="40" cy="20" r="18" fill="#F79E1B" />
        <path d="M30 7a18 18 0 0 0 0 26" fill="#FF5F00" />
    </svg>
);

const AmexLogo = () => (
    <svg viewBox="0 0 80 26" className={styles.brandLogo}>
        <rect width="80" height="26" rx="4" fill="rgba(255,255,255,0.2)" />
        <text x="8" y="18" fill="#fff" fontSize="14" fontWeight="700" fontFamily="Arial, sans-serif">AMEX</text>
    </svg>
);

const DiscoverLogo = () => (
    <svg viewBox="0 0 100 30" className={styles.brandLogo}>
        <text x="0" y="22" fill="#fff" fontSize="16" fontWeight="700" fontFamily="Arial, sans-serif">DISCOVER</text>
    </svg>
);

const PayPalLogo = () => (
    <svg viewBox="0 0 80 26" className={styles.brandLogo}>
        <text x="0" y="20" fill="#fff" fontSize="16" fontWeight="700" fontFamily="Arial, sans-serif">PayPal</text>
    </svg>
);

const UnionPayLogo = () => (
    <svg viewBox="0 0 90 30" className={styles.brandLogo}>
        <text x="0" y="22" fill="#fff" fontSize="14" fontWeight="700" fontFamily="Arial, sans-serif">UnionPay</text>
    </svg>
);

const JCBLogo = () => (
    <svg viewBox="0 0 50 30" className={styles.brandLogo}>
        <text x="0" y="22" fill="#fff" fontSize="18" fontWeight="800" fontFamily="Arial, sans-serif">JCB</text>
    </svg>
);

const GenericLogo = () => (
    <svg viewBox="0 0 60 26" className={styles.brandLogo}>
        <text x="0" y="20" fill="#fff" fontSize="16" fontWeight="700" fontFamily="Arial, sans-serif">BANK</text>
    </svg>
);

const getBrandLogo = (brand: CardBrand) => {
    switch (brand) {
        case 'visa': return <VisaLogo />;
        case 'mastercard': return <MastercardLogo />;
        case 'amex': return <AmexLogo />;
        case 'discover': return <DiscoverLogo />;
        case 'paypal': return <PayPalLogo />;
        case 'unionpay': return <UnionPayLogo />;
        case 'jcb': return <JCBLogo />;
        default: return <GenericLogo />;
    }
};

// Professional card brand gradients
const getBrandGradient = (brand: CardBrand): string => {
    switch (brand) {
        case 'visa':
            return 'linear-gradient(135deg, #1a1f71 0%, #2d3c8a 50%, #1a1f71 100%)';
        case 'mastercard':
            return 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)';
        case 'amex':
            return 'linear-gradient(135deg, #006fcf 0%, #0087d7 50%, #00a3e0 100%)';
        case 'discover':
            return 'linear-gradient(135deg, #ff6000 0%, #ff8c00 50%, #ff6000 100%)';
        case 'paypal':
            return 'linear-gradient(135deg, #003087 0%, #009cde 100%)';
        case 'jcb':
            return 'linear-gradient(135deg, #0865a8 0%, #1a3d5c 100%)';
        case 'unionpay':
            return 'linear-gradient(135deg, #02798b 0%, #065a6b 100%)';
        case 'diners':
            return 'linear-gradient(135deg, #1a1f71 0%, #4a5568 100%)';
        default:
            return 'linear-gradient(135deg, #1f2937 0%, #374151 50%, #1f2937 100%)';
    }
};

// Card Details Modal Component
interface CardDetailsModalProps {
    card: Card;
    isOpen: boolean;
    onClose: () => void;
    onRevealCVV: () => void;
    isCVVRevealed: boolean;
    cvvExpiresAt?: number;
    onCVVExpire: () => void;
    onDelete: () => void;
}

const CardDetailsModal = ({
    card,
    isOpen,
    onClose,
    onRevealCVV,
    isCVVRevealed,
    cvvExpiresAt,
    onCVVExpire,
    onDelete
}: CardDetailsModalProps) => {
    const { user } = useAuthStore();
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [remainingTime, setRemainingTime] = useState(0);

    // CVV Timer
    useEffect(() => {
        if (!isCVVRevealed || !cvvExpiresAt) return;

        const updateTimer = () => {
            const remaining = Math.max(0, Math.floor((cvvExpiresAt - Date.now()) / 1000));
            setRemainingTime(remaining);
            if (remaining <= 0) {
                onCVVExpire();
            }
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [isCVVRevealed, cvvExpiresAt, onCVVExpire]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const copyToClipboard = async (text: string, field: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedField(field);
            toast.success(`${field} copied! 📋`);
            setTimeout(() => setCopiedField(null), 2000);
        } catch (err) {
            toast.error('Failed to copy');
        }
    };

    if (!isOpen) return null;

    return (
        <motion.div
            className={styles.modalOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
        >
            <motion.div
                className={styles.cardDetailsModal}
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                onClick={(e) => e.stopPropagation()}
            >
                <button className={styles.modalCloseBtn} onClick={onClose}>
                    <X size={20} />
                </button>

                {/* Card Preview */}
                <div className={styles.modalCardPreview} style={{ background: getBrandGradient(card.type) }}>
                    <div className={styles.cardShine}></div>
                    <div className={styles.modalCardTop}>
                        <div className={styles.chip}></div>
                        <div className={styles.brandArea}>
                            <Smartphone size={20} opacity={0.7} />
                            {getBrandLogo(card.type)}
                        </div>
                    </div>
                    <div className={styles.modalCardNumber}>{card.number}</div>
                    <div className={styles.modalCardBottom}>
                        <div>
                            <span className={styles.infoLabel}>HOLDER</span>
                            <span className={styles.infoValue}>{card.holder || user?.name}</span>
                        </div>
                        <div>
                            <span className={styles.infoLabel}>EXP</span>
                            <span className={styles.infoValue}>{card.expiry}</span>
                        </div>
                    </div>
                </div>

                {/* Card Details List */}
                <div className={styles.cardDetailsList}>
                    <h3>Card Details 💳</h3>

                    {/* Card Number */}
                    <div className={styles.detailItem}>
                        <div className={styles.detailLabel}>
                            <CreditCard size={16} />
                            Card Number
                        </div>
                        <div className={styles.detailValue}>
                            <span>{card.number}</span>
                            <button
                                className={styles.copyBtn}
                                onClick={() => copyToClipboard(card.number.replace(/\s/g, ''), 'Card number')}
                            >
                                {copiedField === 'Card number' ? <Check size={16} /> : <Copy size={16} />}
                            </button>
                        </div>
                    </div>

                    {/* Card Holder */}
                    <div className={styles.detailItem}>
                        <div className={styles.detailLabel}>
                            <Shield size={16} />
                            Card Holder
                        </div>
                        <div className={styles.detailValue}>
                            <span>{card.holder || user?.name}</span>
                            <button
                                className={styles.copyBtn}
                                onClick={() => copyToClipboard(card.holder || user?.name || '', 'Holder name')}
                            >
                                {copiedField === 'Holder name' ? <Check size={16} /> : <Copy size={16} />}
                            </button>
                        </div>
                    </div>

                    {/* Expiry */}
                    <div className={styles.detailItem}>
                        <div className={styles.detailLabel}>
                            <Clock size={16} />
                            Expiry Date
                        </div>
                        <div className={styles.detailValue}>
                            <span>{card.expiry}</span>
                            <button
                                className={styles.copyBtn}
                                onClick={() => copyToClipboard(card.expiry, 'Expiry date')}
                            >
                                {copiedField === 'Expiry date' ? <Check size={16} /> : <Copy size={16} />}
                            </button>
                        </div>
                    </div>

                    {/* CVV */}
                    <div className={styles.detailItem}>
                        <div className={styles.detailLabel}>
                            <Lock size={16} />
                            CVV
                        </div>
                        <div className={styles.detailValue}>
                            {isCVVRevealed ? (
                                <>
                                    <span className={styles.cvvRevealed}>{card.cvv}</span>
                                    <div className={styles.cvvTimer}>
                                        <Clock size={12} />
                                        {formatTime(remainingTime)}
                                    </div>
                                    <button
                                        className={styles.copyBtn}
                                        onClick={() => copyToClipboard(card.cvv, 'CVV')}
                                    >
                                        {copiedField === 'CVV' ? <Check size={16} /> : <Copy size={16} />}
                                    </button>
                                </>
                            ) : (
                                <>
                                    <span className={styles.cvvHidden}>•••</span>
                                    <button
                                        className={styles.revealCvvBtn}
                                        onClick={onRevealCVV}
                                    >
                                        <Eye size={14} /> Reveal
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Card Type */}
                    <div className={styles.detailItem}>
                        <div className={styles.detailLabel}>
                            <Zap size={16} />
                            Card Type
                        </div>
                        <div className={styles.detailValue}>
                            <span style={{ textTransform: 'capitalize' }}>{card.type}</span>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className={styles.modalActions}>
                    <button
                        className={styles.copyAllBtn}
                        onClick={() => {
                            const text = `Card: ${card.number}\nHolder: ${card.holder || user?.name}\nExpiry: ${card.expiry}${isCVVRevealed ? `\nCVV: ${card.cvv}` : ''}`;
                            copyToClipboard(text, 'All details');
                        }}
                    >
                        <Copy size={16} /> Copy All
                    </button>
                    <button
                        className={styles.deleteBtn}
                        onClick={() => {
                            onDelete();
                            onClose();
                        }}
                    >
                        <Trash2 size={16} /> Delete Card
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};

// PIN Modal Component
interface PinModalProps {
    isOpen: boolean;
    onClose: () => void;
    onVerify: (pin: string) => boolean;
    cardBrand: CardBrand;
}

const PinModal = ({ isOpen, onClose, onVerify, cardBrand }: PinModalProps) => {
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsVerifying(true);
        setError('');

        setTimeout(() => {
            const success = onVerify(pin);
            setIsVerifying(false);

            if (success) {
                setPin('');
                onClose();
            } else {
                setError('Incorrect PIN. Try again.');
                setPin('');
            }
        }, 500);
    };

    const handleClose = () => {
        setPin('');
        setError('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <motion.div
            className={styles.pinOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
        >
            <motion.div
                className={styles.pinModal}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className={styles.pinHeader}>
                    <div className={styles.pinIcon} style={{ background: getBrandGradient(cardBrand) }}>
                        <Lock size={24} color="#fff" />
                    </div>
                    <h3>Enter PIN to Reveal CVV</h3>
                    <p>Your CVV will be visible for 5 minutes</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className={styles.pinInputWrapper}>
                        <input
                            type="password"
                            value={pin}
                            onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder="Enter PIN"
                            className={`${styles.pinInput} ${error ? styles.pinError : ''}`}
                            autoFocus
                            maxLength={6}
                        />
                    </div>

                    {error && (
                        <motion.div
                            className={styles.errorMessage}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <AlertCircle size={16} />
                            {error}
                        </motion.div>
                    )}

                    <div className={styles.pinActions}>
                        <button type="button" className={styles.cancelBtn} onClick={handleClose}>
                            Cancel
                        </button>
                        <button type="submit" className={styles.verifyBtn} disabled={pin.length < 4 || isVerifying}>
                            {isVerifying ? 'Verifying...' : 'Reveal CVV'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
};

const CardsPage = () => {
    const { cards, removeCard } = useCardStore();
    const { openAddCard } = useModalStore();
    const { user } = useAuthStore();

    // CVV reveal state with expiry timestamps
    const [revealedCVVs, setRevealedCVVs] = useState<{ [cardId: string]: number }>({});
    const [pinModalCard, setPinModalCard] = useState<Card | null>(null);
    const [detailsModalCard, setDetailsModalCard] = useState<Card | null>(null);

    const handleDelete = (id: string) => {
        removeCard(id);
        toast.success("Card removed! 🗑️", { icon: () => <span>🗑️</span> });
        setRevealedCVVs(prev => {
            const { [id]: _, ...rest } = prev;
            return rest;
        });
    };

    const handleRevealClick = (card: Card) => {
        if (revealedCVVs[card.id] && revealedCVVs[card.id] > Date.now()) {
            return;
        }
        setPinModalCard(card);
    };

    const handlePinVerify = useCallback((pin: string): boolean => {
        if (!pinModalCard) return false;

        if (pin === pinModalCard.pin) {
            const expiresAt = Date.now() + (5 * 60 * 1000);
            setRevealedCVVs(prev => ({ ...prev, [pinModalCard.id]: expiresAt }));
            toast.success('CVV revealed for 5 minutes ⏱️', {
                icon: () => <span>🔓</span>
            });
            return true;
        }
        return false;
    }, [pinModalCard]);

    const handleCVVExpire = useCallback((cardId: string) => {
        setRevealedCVVs(prev => {
            const { [cardId]: _, ...rest } = prev;
            return rest;
        });
        toast.info('CVV hidden for security 🔒', {
            icon: () => <span>🔒</span>
        });
    }, []);

    const isCVVRevealed = (cardId: string) => {
        const expiresAt = revealedCVVs[cardId];
        return !!(expiresAt && expiresAt > Date.now());
    };

    return (
        <div className={styles.container}>
            {/* PIN Modal */}
            <AnimatePresence>
                {pinModalCard && (
                    <PinModal
                        isOpen={true}
                        onClose={() => setPinModalCard(null)}
                        onVerify={handlePinVerify}
                        cardBrand={pinModalCard.type}
                    />
                )}
            </AnimatePresence>

            {/* Card Details Modal */}
            <AnimatePresence>
                {detailsModalCard && (
                    <CardDetailsModal
                        card={detailsModalCard}
                        isOpen={true}
                        onClose={() => setDetailsModalCard(null)}
                        onRevealCVV={() => {
                            setPinModalCard(detailsModalCard);
                        }}
                        isCVVRevealed={isCVVRevealed(detailsModalCard.id)}
                        cvvExpiresAt={revealedCVVs[detailsModalCard.id]}
                        onCVVExpire={() => handleCVVExpire(detailsModalCard.id)}
                        onDelete={() => handleDelete(detailsModalCard.id)}
                    />
                )}
            </AnimatePresence>

            {/* Hero Header */}
            <div className={styles.heroHeader}>
                <div className={styles.heroContent}>
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        <h1>My Wallet 💳</h1>
                        <p>Secure the bag. Manage your cards.</p>
                    </motion.div>
                    <motion.button
                        className={styles.addBtn}
                        onClick={openAddCard}
                        whileHover={{ scale: 1.05, rotate: -2 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <Plus size={20} /> Add New
                    </motion.button>
                </div>

                {/* Stats Row */}
                <div className={styles.statsRow}>
                    <motion.div className={styles.stat} whileHover={{ y: -5 }}>
                        <CreditCard size={24} />
                        <div>
                            <span className={styles.statValue}>{cards.length}</span>
                            <span className={styles.statLabel}>Cards</span>
                        </div>
                    </motion.div>
                    <motion.div className={styles.stat} whileHover={{ y: -5 }}>
                        <Shield size={24} />
                        <div>
                            <span className={styles.statValue}>256-bit</span>
                            <span className={styles.statLabel}>Encrypted</span>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Main Content */}
            <div className={styles.mainContent}>
                {/* Cards Grid */}
                <div className={styles.cardsSection}>
                    <h2>Your Collection ✨</h2>
                    <p className={styles.sectionHint}>Click on a card to view details & copy info</p>

                    {cards.length === 0 ? (
                        <motion.div
                            className={styles.emptyState}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            <CreditCard size={64} />
                            <h3>No cards yet fam</h3>
                            <p>Add a card to start tracking!</p>
                            <button onClick={openAddCard} className={styles.addBtn}>
                                <Plus size={20} /> Add First Card
                            </button>
                        </motion.div>
                    ) : (
                        <div className={styles.cardsGrid}>
                            <AnimatePresence>
                                {cards.map((card, index) => (
                                    <motion.div
                                        key={card.id}
                                        className={styles.cardWrapper}
                                        onClick={() => setDetailsModalCard(card)}
                                        initial={{ opacity: 0, y: 30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={{ delay: index * 0.1 }}
                                        whileHover={{ y: -8, scale: 1.02 }}
                                        layout
                                    >
                                        <div
                                            className={styles.card}
                                            style={{ background: getBrandGradient(card.type) }}
                                        >
                                            <div className={styles.cardShine}></div>
                                            <div className={styles.cardClickHint}>
                                                <Eye size={16} /> View Details
                                            </div>

                                            <div className={styles.cardTop}>
                                                <div className={styles.chip}></div>
                                                <div className={styles.brandArea}>
                                                    <Smartphone size={20} opacity={0.7} />
                                                    {getBrandLogo(card.type)}
                                                </div>
                                            </div>

                                            <div className={styles.cardNumber}>
                                                {card.number || '•••• •••• •••• ••••'}
                                            </div>

                                            <div className={styles.cardBottom}>
                                                <div className={styles.cardInfo}>
                                                    <span className={styles.infoLabel}>HOLDER</span>
                                                    <span className={styles.infoValue}>{card.holder || user?.name}</span>
                                                </div>
                                                <div className={styles.cardInfo}>
                                                    <span className={styles.infoLabel}>EXP</span>
                                                    <span className={styles.infoValue}>{card.expiry}</span>
                                                </div>
                                            </div>

                                            {/* Quick Reveal Button */}
                                            <div className={styles.cvvArea}>
                                                <motion.button
                                                    className={styles.revealBtn}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleRevealClick(card);
                                                    }}
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                >
                                                    {isCVVRevealed(card.id) ? (
                                                        <><span className={styles.cvvVisible}>{card.cvv}</span></>
                                                    ) : (
                                                        <><Eye size={14} /> Reveal CVV →</>
                                                    )}
                                                </motion.button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>

                            {/* Add Card Placeholder */}
                            <motion.div
                                className={styles.addCardPlaceholder}
                                onClick={openAddCard}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <Plus size={48} strokeWidth={2} />
                                <span>Add New Card</span>
                            </motion.div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CardsPage;
