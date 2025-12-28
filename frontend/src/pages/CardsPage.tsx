import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, CreditCard, Trash2, Eye, Shield, Smartphone, X, Clock, Lock, Copy,
    Landmark, Building2, CheckCircle2, Edit3, Snowflake, Star, TrendingUp,
    Calendar, DollarSign, BarChart3, AlertCircle, Check, Pencil
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card as UICard, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useCardStore, useModalStore, useAuthStore, Card, CardBrand } from '../store/useStore';
import { cardService, getBrandGradient, getThemeById } from '../services/cardService';
import { toast } from 'sonner';
import { CardsSkeleton } from '../components/LoadingSkeleton';
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
    const { cards, initializeCards, removeCard, updateCard, isLoading: cardsLoading } = useCardStore();
    const { openAddCard } = useModalStore();
    const { user } = useAuthStore();
    const sound = useSound();

    // State
    const [viewingCard, setViewingCard] = useState<Card | null>(null);
    const [isEditingNickname, setIsEditingNickname] = useState(false);
    const [editedNickname, setEditedNickname] = useState('');
    const [isEditingLimit, setIsEditingLimit] = useState(false);
    const [editedLimit, setEditedLimit] = useState('');

    // CVV Password State
    const [cvvPassword, setCvvPassword] = useState('');
    const [confirmCvvPassword, setConfirmCvvPassword] = useState('');
    const [isSettingCvvPassword, setIsSettingCvvPassword] = useState(false);
    const [isVerifyingCvv, setIsVerifyingCvv] = useState(false);
    const [cvvVerified, setCvvVerified] = useState(false);
    const [cvvValue, setCvvValue] = useState('');
    const [cvvTimer, setCvvTimer] = useState(0);

    // Computed values
    const totalSpending = cards.reduce((sum, c) => sum + (c.total_spent || 0), 0);
    const frozenCount = cards.filter(c => c.is_frozen).length;
    const defaultCard = cards.find(c => c.is_default);

    // Initialize cards on mount
    useEffect(() => {
        if (user?.id) {
            initializeCards(user.id);
        }
    }, [user?.id, initializeCards]);

    // Listen for card changes
    useEffect(() => {
        const handleCardChange = () => {
            if (user?.id) initializeCards(user.id);
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

    // Toggle freeze
    const handleToggleFreeze = async () => {
        if (!viewingCard) return;
        const newFrozen = !viewingCard.is_frozen;
        updateCard(viewingCard.id, { is_frozen: newFrozen });
        setViewingCard({ ...viewingCard, is_frozen: newFrozen });
        toast.success(newFrozen ? 'Card frozen' : 'Card unfrozen');
        sound.playClick();
    };

    // Set as default
    const handleSetDefault = async () => {
        if (!viewingCard) return;
        // Unset previous default
        cards.forEach(c => {
            if (c.is_default && c.id !== viewingCard.id) {
                updateCard(c.id, { is_default: false });
            }
        });
        updateCard(viewingCard.id, { is_default: true });
        setViewingCard({ ...viewingCard, is_default: true });
        toast.success('Set as default card');
        sound.playSuccess();
    };

    // Save nickname
    const handleSaveNickname = async () => {
        if (!viewingCard) return;
        updateCard(viewingCard.id, { nickname: editedNickname });
        setViewingCard({ ...viewingCard, nickname: editedNickname });
        setIsEditingNickname(false);
        toast.success('Nickname updated');
        sound.playClick();
    };

    // Save spending limit
    const handleSaveLimit = async () => {
        if (!viewingCard) return;
        const limit = parseFloat(editedLimit) || 0;
        updateCard(viewingCard.id, { spending_limit: limit });
        setViewingCard({ ...viewingCard, spending_limit: limit });
        setIsEditingLimit(false);
        toast.success('Spending limit updated');
        sound.playClick();
    };

    // Delete card
    const handleDeleteCard = async () => {
        if (!viewingCard) return;
        if (confirm('Are you sure you want to delete this card?')) {
            removeCard(viewingCard.id);
            setViewingCard(null);
            toast.success('Card deleted');
            sound.playSuccess();
        }
    };

    // Copy to clipboard
    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('Copied');
        sound.playClick();
    };

    // Format spending limit percentage
    const getSpendingProgress = (card: Card) => {
        if (!card.spending_limit || card.spending_limit === 0) return 0;
        return Math.min(100, ((card.total_spent || 0) / card.spending_limit) * 100);
    };

    // Format last used
    const formatLastUsed = (date?: string) => {
        if (!date) return 'Never used';
        const d = new Date(date);
        const now = new Date();
        const diff = now.getTime() - d.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        if (days === 0) return 'Today';
        if (days === 1) return 'Yesterday';
        if (days < 7) return `${days} days ago`;
        return d.toLocaleDateString();
    };

    // CVV Timer countdown
    useEffect(() => {
        if (cvvTimer > 0) {
            const timer = setTimeout(() => setCvvTimer(cvvTimer - 1), 1000);
            return () => clearTimeout(timer);
        } else if (cvvTimer === 0 && cvvVerified) {
            setCvvVerified(false);
            setCvvValue('');
        }
    }, [cvvTimer, cvvVerified]);

    // Save CVV password to Supabase
    const handleSaveCvvPassword = async () => {
        if (!viewingCard) return;
        if (cvvPassword.length < 4) {
            toast.error('Password must be at least 4 characters');
            return;
        }
        if (cvvPassword !== confirmCvvPassword) {
            toast.error('Passwords do not match');
            return;
        }
        // Save to card (will be synced to Supabase via cardService)
        updateCard(viewingCard.id, {
            cvv_password: cvvPassword,
            cvv_encrypted: cvvValue // Store the CVV encrypted
        });
        setViewingCard({ ...viewingCard, cvv_password: cvvPassword, cvv_encrypted: cvvValue });
        setIsSettingCvvPassword(false);
        setCvvPassword('');
        setConfirmCvvPassword('');
        setCvvValue('');
        toast.success('CVV password saved securely');
        sound.playSuccess();
    };

    // Verify CVV password
    const handleVerifyCvv = () => {
        if (!viewingCard) return;
        if (cvvPassword === viewingCard.cvv_password) {
            setCvvVerified(true);
            setCvvTimer(30); // Show CVV for 30 seconds
            setCvvValue(viewingCard.cvv_encrypted || '***');
            setIsVerifyingCvv(false);
            setCvvPassword('');
            toast.success('CVV revealed for 30 seconds');
            sound.playSuccess();
        } else {
            toast.error('Incorrect password');
            sound.playClick();
        }
    };

    // Reset CVV state when card changes
    const handleCardClick = (card: Card) => {
        setViewingCard(card);
        setEditedNickname(card.nickname || '');
        setEditedLimit(card.spending_limit?.toString() || '');
        setIsEditingNickname(false);
        setIsEditingLimit(false);
        setCvvVerified(false);
        setCvvPassword('');
        setConfirmCvvPassword('');
        setIsSettingCvvPassword(false);
        setIsVerifyingCvv(false);
        setCvvTimer(0);
        setCvvValue('');
        sound.playClick();
    };

    if (cardsLoading && cards.length === 0) {
        return <CardsSkeleton />;
    }


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

            {/* Enhanced Card Details Modal */}
            <Dialog open={!!viewingCard} onOpenChange={() => setViewingCard(null)}>
                <AnimatePresence>
                    {viewingCard && (
                        <DialogContent className={cn(styles.glassDialog, "max-w-lg")}>
                            <div className={styles.modalHeader}>
                                <div className="absolute top-6 right-6 flex gap-2">
                                    {viewingCard.is_frozen && (
                                        <Badge className="bg-blue-100 text-blue-700 font-bold">
                                            <Snowflake className="h-3 w-3 mr-1" /> Frozen
                                        </Badge>
                                    )}
                                    {viewingCard.is_default && (
                                        <Badge className="bg-amber-100 text-amber-700 font-bold">
                                            <Star className="h-3 w-3 mr-1" /> Default
                                        </Badge>
                                    )}
                                </div>
                                <div className={cn(styles.modalIcon, viewingCard.is_frozen ? "bg-blue-600" : "bg-indigo-600")}>
                                    {viewingCard.is_frozen ? <Snowflake className="h-8 w-8" /> : <CreditCard className="h-8 w-8" />}
                                </div>
                                {/* Nickname Section */}
                                {isEditingNickname ? (
                                    <div className="flex items-center gap-2 justify-center">
                                        <Input
                                            value={editedNickname}
                                            onChange={(e) => setEditedNickname(e.target.value)}
                                            placeholder="Card nickname..."
                                            className="h-8 w-40 text-center font-bold rounded-lg text-sm"
                                            autoFocus
                                        />
                                        <Button size="icon" className="h-8 w-8 rounded-lg bg-emerald-500 hover:bg-emerald-600" onClick={handleSaveNickname}>
                                            <Check className="h-3 w-3" />
                                        </Button>
                                        <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg" onClick={() => setIsEditingNickname(false)}>
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </div>
                                ) : (
                                    <DialogTitle className="text-xl font-black text-slate-800 tracking-tight flex items-center justify-center gap-1">
                                        {viewingCard.nickname || `${viewingCard.type.toUpperCase()} •••${viewingCard.last4}`}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 rounded-md hover:bg-slate-100"
                                            onClick={() => { setEditedNickname(viewingCard.nickname || ''); setIsEditingNickname(true); }}
                                        >
                                            <Pencil className="h-3 w-3 text-slate-400" />
                                        </Button>
                                    </DialogTitle>
                                )}
                                <DialogDescription className="text-slate-500 font-bold text-xs">
                                    {viewingCard.holder} • Expires {viewingCard.expiry}
                                </DialogDescription>
                            </div>

                            <div className={styles.modalContent}>
                                {/* Card Preview */}
                                <div className="mb-4">
                                    <PremiumCard card={viewingCard} showFullNumber={false} className="scale-90 origin-top" />
                                </div>

                                {/* Spending Limit Section */}
                                <div className="bg-slate-50 rounded-xl p-3 mb-3 border border-slate-100">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-1.5">
                                            <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
                                            <span className="font-bold text-[11px] text-slate-700">Monthly Limit</span>
                                        </div>
                                        {isEditingLimit ? (
                                            <div className="flex items-center gap-1.5">
                                                <Input
                                                    type="number"
                                                    value={editedLimit}
                                                    onChange={(e) => setEditedLimit(e.target.value)}
                                                    placeholder="0"
                                                    className="h-7 w-20 text-right font-bold rounded-md text-[11px]"
                                                />
                                                <Button size="icon" className="h-7 w-7 rounded-md bg-emerald-500 hover:bg-emerald-600" onClick={handleSaveLimit}>
                                                    <Check className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <Button
                                                variant="ghost"
                                                className="h-7 text-[10px] font-black text-slate-500 hover:text-slate-700 p-0 px-2"
                                                onClick={() => { setEditedLimit(viewingCard.spending_limit?.toString() || ''); setIsEditingLimit(true); }}
                                            >
                                                {viewingCard.spending_limit ? `Rs ${viewingCard.spending_limit.toLocaleString()}` : 'Set limit'}
                                                <Pencil className="h-2.5 w-2.5 ml-1" />
                                            </Button>
                                        )}
                                    </div>
                                    {viewingCard.spending_limit && viewingCard.spending_limit > 0 && (
                                        <>
                                            <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${getSpendingProgress(viewingCard)}%` }}
                                                    className={cn(
                                                        "h-full rounded-full",
                                                        getSpendingProgress(viewingCard) > 90 ? "bg-red-500" :
                                                            getSpendingProgress(viewingCard) > 70 ? "bg-amber-500" : "bg-emerald-500"
                                                    )}
                                                />
                                            </div>
                                            <div className="flex justify-between mt-1 text-[10px] font-black">
                                                <span className="text-slate-500">Rs {(viewingCard.total_spent || 0).toLocaleString()} spent</span>
                                                <span className={cn(
                                                    getSpendingProgress(viewingCard) > 90 ? "text-red-500" : "text-slate-400"
                                                )}>
                                                    {Math.round(getSpendingProgress(viewingCard))}%
                                                </span>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Usage Insights & Quick Actions Grid */}
                                <div className="grid grid-cols-2 gap-2 mb-3">
                                    <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 flex items-center gap-2">
                                        <Calendar className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold text-slate-400 leading-tight">Last Used</span>
                                            <span className="font-black text-slate-700 text-xs leading-tight">{formatLastUsed(viewingCard.last_used_at)}</span>
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 flex items-center gap-2">
                                        <BarChart3 className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold text-slate-400 leading-tight">This Month</span>
                                            <span className="font-black text-slate-700 text-xs leading-tight">Rs {(viewingCard.total_spent || 0).toLocaleString()}</span>
                                        </div>
                                    </div>

                                    <Button
                                        variant={viewingCard.is_frozen ? "default" : "outline"}
                                        className={cn(
                                            "h-10 rounded-xl font-black text-xs",
                                            viewingCard.is_frozen
                                                ? "bg-blue-600 hover:bg-blue-700 text-white"
                                                : "border-slate-200 text-slate-600 hover:bg-slate-50"
                                        )}
                                        onClick={handleToggleFreeze}
                                    >
                                        <Snowflake className="h-3.5 w-3.5 mr-1.5" />
                                        {viewingCard.is_frozen ? 'Unfreeze' : 'Freeze'}
                                    </Button>
                                    <Button
                                        variant={viewingCard.is_default ? "default" : "outline"}
                                        className={cn(
                                            "h-10 rounded-xl font-black text-xs",
                                            viewingCard.is_default
                                                ? "bg-amber-500 hover:bg-amber-600 text-white border-transparent"
                                                : "border-slate-200 text-slate-600 hover:bg-slate-50"
                                        )}
                                        onClick={handleSetDefault}
                                        disabled={viewingCard.is_default}
                                    >
                                        <Star className="h-3.5 w-3.5 mr-1.5" />
                                        {viewingCard.is_default ? 'Default' : 'Set Default'}
                                    </Button>
                                </div>

                                {/* Card Info */}
                                <div className={styles.vaultDetails}>
                                    <div className={styles.detailRow}>
                                        <div className="flex items-center gap-2">
                                            <CreditCard className="h-5 w-5 text-blue-500" />
                                            <div className="flex flex-col">
                                                <span className={styles.infoLabel}>Card Number</span>
                                                <code className="text-sm font-black tracking-widest">
                                                    •••• •••• •••• {viewingCard.last4 || '****'}
                                                </code>
                                            </div>
                                        </div>
                                        <Button size="icon" variant="ghost" className="rounded-xl" onClick={() => handleCopy(viewingCard.last4 || '')}>
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    <div className={styles.detailRow}>
                                        <div className="flex items-center gap-3">
                                            <Shield className="h-5 w-5 text-emerald-500" />
                                            <div className="flex flex-col">
                                                <span className={styles.infoLabel}>Security</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-black text-emerald-600">Encrypted</span>
                                                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* CVV Protection Section */}
                                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-100 mt-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Lock className="h-4 w-4 text-indigo-600" />
                                        <span className="font-bold text-sm text-indigo-700">CVV Protection</span>
                                    </div>

                                    {/* If setting CVV password */}
                                    {isSettingCvvPassword ? (
                                        <div className="space-y-3">
                                            <Input
                                                type="password"
                                                placeholder="Enter CVV (3-4 digits)"
                                                value={cvvValue}
                                                onChange={(e) => setCvvValue(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                                className="h-10 rounded-lg text-center font-bold tracking-widest"
                                                maxLength={4}
                                            />
                                            <Input
                                                type="password"
                                                placeholder="Set password (min 4 chars)"
                                                value={cvvPassword}
                                                onChange={(e) => setCvvPassword(e.target.value)}
                                                className="h-10 rounded-lg"
                                            />
                                            <Input
                                                type="password"
                                                placeholder="Confirm password"
                                                value={confirmCvvPassword}
                                                onChange={(e) => setConfirmCvvPassword(e.target.value)}
                                                className="h-10 rounded-lg"
                                            />
                                            <div className="flex gap-2">
                                                <Button
                                                    className="flex-1 h-10 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                                                    onClick={handleSaveCvvPassword}
                                                >
                                                    <Lock className="h-4 w-4 mr-2" />
                                                    Save CVV
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    className="h-10 rounded-lg"
                                                    onClick={() => { setIsSettingCvvPassword(false); setCvvPassword(''); setConfirmCvvPassword(''); setCvvValue(''); }}
                                                >
                                                    Cancel
                                                </Button>
                                            </div>
                                        </div>
                                    ) : isVerifyingCvv ? (
                                        /* Verifying CVV password */
                                        <div className="space-y-3">
                                            <Input
                                                type="password"
                                                placeholder="Enter your CVV password"
                                                value={cvvPassword}
                                                onChange={(e) => setCvvPassword(e.target.value)}
                                                className="h-10 rounded-lg"
                                                autoFocus
                                            />
                                            <div className="flex gap-2">
                                                <Button
                                                    className="flex-1 h-10 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                                                    onClick={handleVerifyCvv}
                                                >
                                                    <Eye className="h-4 w-4 mr-2" />
                                                    Reveal CVV
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    className="h-10 rounded-lg"
                                                    onClick={() => { setIsVerifyingCvv(false); setCvvPassword(''); }}
                                                >
                                                    Cancel
                                                </Button>
                                            </div>
                                        </div>
                                    ) : cvvVerified ? (
                                        /* CVV Revealed */
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-black tracking-widest text-lg">
                                                    {cvvValue}
                                                </div>
                                                <span className="text-xs font-bold text-indigo-500">
                                                    Hiding in {cvvTimer}s
                                                </span>
                                            </div>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="rounded-lg"
                                                onClick={() => handleCopy(cvvValue)}
                                            >
                                                <Copy className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ) : (
                                        /* Default state */
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-slate-600">
                                                {viewingCard.cvv_password ? 'CVV protected with password' : 'No CVV saved yet'}
                                            </span>
                                            {viewingCard.cvv_password ? (
                                                <Button
                                                    variant="outline"
                                                    className="h-9 rounded-lg text-indigo-600 border-indigo-200 hover:bg-indigo-50 font-bold"
                                                    onClick={() => setIsVerifyingCvv(true)}
                                                >
                                                    <Eye className="h-4 w-4 mr-2" />
                                                    View CVV
                                                </Button>
                                            ) : (
                                                <Button
                                                    variant="outline"
                                                    className="h-9 rounded-lg text-indigo-600 border-indigo-200 hover:bg-indigo-50 font-bold"
                                                    onClick={() => setIsSettingCvvPassword(true)}
                                                >
                                                    <Lock className="h-4 w-4 mr-2" />
                                                    Set CVV
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex gap-3 mt-6">
                                    <Button
                                        className="flex-1 h-12 rounded-xl bg-slate-900 hover:bg-black text-white font-bold"
                                        onClick={() => setViewingCard(null)}
                                    >
                                        <CheckCircle2 className="h-4 w-4 mr-2" />
                                        Done
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="h-12 w-12 rounded-xl border-2 border-red-100 text-red-500 hover:bg-red-50"
                                        onClick={handleDeleteCard}
                                    >
                                        <Trash2 className="h-5 w-5" />
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
