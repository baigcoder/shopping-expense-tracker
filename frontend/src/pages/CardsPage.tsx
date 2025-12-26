import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, CreditCard, Trash2, Eye, Shield, Smartphone, X, Clock, Lock, Copy, Landmark, Building2, CheckCircle2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card as UICard, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useCardStore, useModalStore, useAuthStore, Card, CardBrand } from '../store/useStore';
import { cardService, getBrandGradient, getThemeById } from '../services/cardService';
import { toast } from 'sonner';
import LoadingScreen from '../components/LoadingScreen';
import PremiumCard from '../components/PremiumCard';
import LinkedAccountsCard from '../components/LinkedAccountsCard';
import { useSound } from '@/hooks/useSound';
import styles from './CardsPage.module.css';
import { cn } from '@/lib/utils';

// Animation Variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
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

    // Listen for card changes to update immediately
    useEffect(() => {
        const handleCardChange = () => {
            console.log('🔄 Card changed - refreshing');
            if (user?.id) {
                initializeCards(user.id);
            }
        };

        window.addEventListener('card-added', handleCardChange);
        window.addEventListener('card-updated', handleCardChange);
        window.addEventListener('card-deleted', handleCardChange);

        return () => {
            window.removeEventListener('card-added', handleCardChange);
            window.removeEventListener('card-updated', handleCardChange);
            window.removeEventListener('card-deleted', handleCardChange);
        };
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
        // NOTE: In production, this would verify against a secure hashed PIN in Supabase
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
        <div className={styles.mainContent}>
            {/* Glass Header */}
            <motion.header
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className={styles.header}
            >
                <div className={styles.headerTitle}>
                    <div className={styles.headerIcon}>
                        <CreditCard className="h-7 w-7" />
                    </div>
                    <div className={styles.headerInfo}>
                        <h1>My Cards</h1>
                        <p>
                            Digital Wallet Management
                            <span className={styles.secureBadge}>Secure</span>
                        </p>
                    </div>
                </div>
                <div className={styles.headerActions}>
                    <Button
                        variant="ghost"
                        className="rounded-2xl font-bold text-slate-500 hover:bg-slate-100 h-12 px-5"
                        onClick={() => initializeCards(user?.id || '')}
                    >
                        <Clock className="mr-2 h-4 w-4" />
                        Refresh
                    </Button>
                    <Button
                        onClick={openAddCard}
                        className="h-12 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black shadow-xl shadow-blue-200 transition-all hover:scale-[1.02]"
                    >
                        <Plus className="mr-2 h-5 w-5" />
                        Add New Card
                    </Button>
                </div>
            </motion.header>

            {/* Overview Section */}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className={styles.overviewGrid}
            >
                {/* Active Cards Stat */}
                <motion.div variants={itemVariants} className={styles.premiumStatCard}>
                    <div className={styles.cardDecoration} />
                    <div className={styles.statHeader}>
                        <div className={cn(styles.statIconContainer, "bg-blue-50 text-blue-600")}>
                            <CreditCard className="h-6 w-6" />
                        </div>
                        <Badge variant="outline" className="border-blue-100 bg-blue-50/50 text-blue-600 font-black text-[10px] uppercase">Active</Badge>
                    </div>
                    <div className={styles.statLabel}>Active Cards</div>
                    <div className={styles.statValueContainer}>
                        <div className={styles.statValue}>{cards.length}</div>
                        <div className={styles.statSubtext}>Digital Assets</div>
                    </div>
                    <div className={styles.statProgress}>
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, (cards.length / 5) * 100)}%` }}
                            className={cn(styles.progressFill, "bg-blue-600")}
                        />
                    </div>
                </motion.div>

                {/* Security Stat */}
                <motion.div variants={itemVariants} className={styles.premiumStatCard}>
                    <div className={styles.cardDecoration} style={{ background: 'radial-gradient(circle, rgba(99, 102, 241, 0.05) 0%, transparent 70%)' }} />
                    <div className={styles.statHeader}>
                        <div className={cn(styles.statIconContainer, "bg-indigo-50 text-indigo-600")}>
                            <Shield className="h-6 w-6" />
                        </div>
                        <Badge variant="outline" className="border-indigo-100 bg-indigo-50/50 text-indigo-600 font-black text-[10px] uppercase">Shielded</Badge>
                    </div>
                    <div className={styles.statLabel}>Security Status</div>
                    <div className={styles.statValueContainer}>
                        <div className={styles.statValue} style={{ color: '#4f46e5' }}>100%</div>
                        <div className={styles.statSubtext}>Encrypted</div>
                    </div>
                    <div className={styles.statProgress}>
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: '100%' }}
                            className={cn(styles.progressFill, "bg-indigo-600")}
                        />
                    </div>
                </motion.div>

                {/* Hub Stat */}
                <motion.div variants={itemVariants} className={styles.premiumStatCard}>
                    <div className={styles.cardDecoration} style={{ background: 'radial-gradient(circle, rgba(16, 185, 129, 0.05) 0%, transparent 70%)' }} />
                    <div className={styles.statHeader}>
                        <div className={cn(styles.statIconContainer, "bg-emerald-50 text-emerald-600")}>
                            <Landmark className="h-6 w-6" />
                        </div>
                        <Badge variant="outline" className="border-emerald-100 bg-emerald-50/50 text-emerald-600 font-black text-[10px] uppercase">Connected</Badge>
                    </div>
                    <div className={styles.statLabel}>Financial Hub</div>
                    <div className={styles.statValueContainer}>
                        <div className={styles.statValue}>Ready</div>
                        <div className={styles.statSubtext}>Digital Pay</div>
                    </div>
                    <div className={styles.statProgress}>
                        <div className="flex items-center gap-1.5 mt-2">
                            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-tighter">Systems Operational</span>
                        </div>
                    </div>
                </motion.div>
            </motion.div>

            {/* Connected Banks Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className={styles.banksSection}
            >
                <div className={styles.banksHeader}>
                    <div className={styles.banksIconContainer}>
                        <Building2 className="h-7 w-7" />
                    </div>
                    <div className={styles.banksInfo}>
                        <h3>Linked Institutions</h3>
                        <p>Manage external financial connections & accounts</p>
                    </div>
                </div>
                <div className={styles.banksContent}>
                    <LinkedAccountsCard />
                </div>
            </motion.div>

            {/* Wallet Section */}
            <div className={styles.walletSection}>
                <div className={styles.sectionHeader}>
                    <div className={styles.sectionTitle}>
                        <h2>Your Digital Wallet</h2>
                        <p>Access your securely stored virtual and physical cards</p>
                    </div>
                    <div className={styles.sectionLine} />
                    <div className={styles.encryptedTag}>
                        <Lock className="h-3 w-3" />
                        Bank-Grade Encryption
                    </div>
                </div>

                <div className={styles.cardsGrid}>
                    {/* Add Card Tile */}
                    <motion.div
                        whileHover={{ scale: 1.02, y: -5 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={openAddCard}
                        className={styles.addCardTile}
                    >
                        <div className={styles.addCardIcon}>
                            <Plus className="h-10 w-10" />
                        </div>
                        <span className={styles.addCardText}>Issue New Card</span>
                    </motion.div>

                    {/* Card List */}
                    <AnimatePresence mode="popLayout">
                        {cards.map((card, index) => (
                            <PremiumCard
                                key={card.id}
                                card={card}
                                onClick={() => handleCardClick(card)}
                            />
                        ))}
                    </AnimatePresence>
                </div>
            </div>

            {/* PIN Verification Modal */}
            <Dialog open={isPinModalOpen} onOpenChange={setIsPinModalOpen}>
                <DialogContent className={styles.glassDialog}>
                    <div className={styles.modalHeader}>
                        <div className={styles.modalIcon}>
                            <Lock className="h-8 w-8" />
                        </div>
                        <DialogTitle className="text-2xl font-black text-slate-800 tracking-tight">Vault Access</DialogTitle>
                        <DialogDescription className="text-slate-500 font-bold">
                            Enter your security PIN to unlock card details
                        </DialogDescription>
                    </div>

                    <div className={styles.modalContent}>
                        <div className={styles.pinContainer}>
                            {pin.map((digit, index) => (
                                <input
                                    key={index}
                                    id={`pin-${index}`}
                                    type="password"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handlePinChange(index, e.target.value)}
                                    className={cn(
                                        styles.pinInput,
                                        pinError && "border-red-500 bg-red-50 text-red-600 animate-shake"
                                    )}
                                />
                            ))}
                        </div>

                        <div className="flex flex-col gap-3">
                            <Button
                                className="h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black shadow-lg shadow-blue-200"
                                onClick={handleVerifyPin}
                                disabled={pin.join('').length < 4}
                            >
                                Unlock Vault
                            </Button>
                            <Button
                                variant="ghost"
                                className="h-12 rounded-xl text-slate-400 font-bold hover:text-slate-600"
                                onClick={() => setIsPinModalOpen(false)}
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Secure Viewing Modal */}
            <Dialog open={!!viewingCard} onOpenChange={() => setViewingCard(null)}>
                <AnimatePresence>
                    {viewingCard && (
                        <DialogContent className={styles.glassDialog}>
                            <div className={styles.modalHeader}>
                                <div className="absolute top-6 right-6">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="rounded-full hover:bg-slate-200"
                                        onClick={() => setViewingCard(null)}
                                    >
                                        <X className="h-5 w-5" />
                                    </Button>
                                </div>
                                <div className={cn(styles.modalIcon, "bg-indigo-600")}>
                                    <Shield className="h-8 w-8" />
                                </div>
                                <DialogTitle className="text-2xl font-black text-slate-800 tracking-tight">Secure Management</DialogTitle>
                                <DialogDescription className="text-slate-500 font-bold">
                                    You are viewing a live encrypted asset
                                </DialogDescription>
                            </div>

                            <div className={styles.modalContent}>
                                {/* Visual Preview */}
                                <PremiumCard
                                    card={viewingCard}
                                    showFullNumber={false} // Match the visual preview in the user's pic
                                />

                                {/* Details List */}
                                <div className={styles.vaultDetails}>
                                    <div className={styles.detailRow}>
                                        <div className="flex items-center gap-3">
                                            <CreditCard className="h-5 w-5 text-blue-500" />
                                            <div className="flex flex-col">
                                                <span className={styles.infoLabel}>Full Number</span>
                                                <code className="text-sm font-black tracking-widest">{viewingCard.number}</code>
                                            </div>
                                        </div>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="rounded-xl"
                                            onClick={() => handleCopy(viewingCard.number || '')}
                                        >
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    <div className={styles.detailRow}>
                                        <div className="flex items-center gap-3">
                                            <Lock className="h-5 w-5 text-indigo-500" />
                                            <div className="flex flex-col">
                                                <span className={styles.infoLabel}>Security CVV</span>
                                                {isCVVRevealed ? (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-lg font-black tracking-widest">{viewingCard.cvv}</span>
                                                        <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100 animate-pulse">
                                                            {timeLeft}s
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-lg font-black tracking-widest text-slate-300">•••</span>
                                                )}
                                            </div>
                                        </div>
                                        {!isCVVRevealed && (
                                            <Button
                                                variant="outline"
                                                className="rounded-xl font-bold h-10 px-4 border-slate-200"
                                                onClick={handleRevealCVV}
                                            >
                                                <Eye className="h-4 w-4 mr-2" />
                                                Reveal
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-4 mt-8">
                                    <Button
                                        className="flex-1 h-14 rounded-2xl bg-slate-900 hover:bg-black text-white font-black shadow-xl"
                                        onClick={() => handleCopy(viewingCard.number || '')}
                                    >
                                        <CheckCircle2 className="h-5 w-5 mr-3" />
                                        Verify & Copy
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="h-14 w-14 rounded-2xl border-2 border-red-50 text-red-500 hover:bg-red-50 hover:border-red-100"
                                        onClick={handleDeleteCard}
                                    >
                                        <Trash2 className="h-6 w-6" />
                                    </Button>
                                </div>
                            </div>
                        </DialogContent>
                    )}
                </AnimatePresence>
            </Dialog>
        </div>
    );
};

export default CardsPage;
