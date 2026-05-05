// CardsPage - Stark Gen Z Brutalist Wallet Audit
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, CreditCard, Trash2, Eye, Shield, Smartphone, X, Clock, Lock, Copy,
    Landmark, Building2, CheckCircle2, Edit3, Snowflake, Star, TrendingUp,
    Calendar, DollarSign, BarChart3, AlertCircle, Check, Pencil, Zap, Target
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
        toast.success(newFrozen ? 'CARD_FROZEN' : 'CARD_UNFROZEN');
        sound.playClick();
    };

    // Set as default
    const handleSetDefault = async () => {
        if (!viewingCard) return;
        cards.forEach(c => {
            if (c.is_default && c.id !== viewingCard.id) {
                updateCard(c.id, { is_default: false });
            }
        });
        updateCard(viewingCard.id, { is_default: true });
        setViewingCard({ ...viewingCard, is_default: true });
        toast.success('DEFAULT_NODE_SET');
        sound.playSuccess();
    };

    // Save nickname
    const handleSaveNickname = async () => {
        if (!viewingCard) return;
        updateCard(viewingCard.id, { nickname: editedNickname });
        setViewingCard({ ...viewingCard, nickname: editedNickname });
        setIsEditingNickname(false);
        toast.success('ALIAS_UPDATED');
        sound.playClick();
    };

    // Save spending limit
    const handleSaveLimit = async () => {
        if (!viewingCard) return;
        const limit = parseFloat(editedLimit) || 0;
        updateCard(viewingCard.id, { spending_limit: limit });
        setViewingCard({ ...viewingCard, spending_limit: limit });
        setIsEditingLimit(false);
        toast.success('LIMIT_VERIFIED');
        sound.playClick();
    };

    // Delete card
    const handleDeleteCard = async () => {
        if (!viewingCard) return;
        if (confirm('TERMINATE_CARD_CONNECTION?')) {
            removeCard(viewingCard.id);
            setViewingCard(null);
            toast.success('NODE_DELETED');
            sound.playSuccess();
        }
    };

    // Copy to clipboard
    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('COPIED_TO_BUFFER');
        sound.playClick();
    };

    // Format spending limit percentage
    const getSpendingProgress = (card: Card) => {
        if (!card.spending_limit || card.spending_limit === 0) return 0;
        return Math.min(100, ((card.total_spent || 0) / card.spending_limit) * 100);
    };

    // Format last used
    const formatLastUsed = (date?: string) => {
        if (!date) return 'NEVER_USED';
        const d = new Date(date);
        const now = new Date();
        const diff = now.getTime() - d.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        if (days === 0) return 'TODAY';
        if (days === 1) return 'YESTERDAY';
        if (days < 7) return `${days}D AGO`;
        return d.toLocaleDateString().toUpperCase();
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

    // Save CVV password
    const handleSaveCvvPassword = async () => {
        if (!viewingCard) return;
        if (cvvPassword.length < 4) {
            toast.error('PASSWORD_MIN_4_CHARS');
            return;
        }
        if (cvvPassword !== confirmCvvPassword) {
            toast.error('MISMATCH_ERROR');
            return;
        }
        updateCard(viewingCard.id, {
            cvv_password: cvvPassword,
            cvv_encrypted: cvvValue
        });
        setViewingCard({ ...viewingCard, cvv_password: cvvPassword, cvv_encrypted: cvvValue });
        setIsSettingCvvPassword(false);
        setCvvPassword('');
        setConfirmCvvPassword('');
        setCvvValue('');
        toast.success('VAULT_PROTECTED');
        sound.playSuccess();
    };

    // Verify CVV password
    const handleVerifyCvv = () => {
        if (!viewingCard) return;
        if (cvvPassword === viewingCard.cvv_password) {
            setCvvVerified(true);
            setCvvTimer(30);
            setCvvValue(viewingCard.cvv_encrypted || '***');
            setIsVerifyingCvv(false);
            setCvvPassword('');
            toast.success('CVV_REVEALED_30S');
            sound.playSuccess();
        } else {
            toast.error('INVALID_ACCESS_KEY');
            sound.playClick();
        }
    };

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
            {/* Brutalist Header */}
            <motion.header
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className={styles.header}
            >
                <div className={styles.headerTitle}>
                    <div className={styles.headerIcon}>
                        <CreditCard size={32} strokeWidth={3} />
                    </div>
                    <div className={styles.headerInfo}>
                        <h1>Wallet Audit</h1>
                        <p>
                            DIGITAL_ASSET_MANAGER
                            <span className={styles.secureBadge}>AUDIT_SECURE</span>
                        </p>
                    </div>
                </div>
                <div className={styles.headerActions}>
                    <button
                        className="h-14 px-8 border-4 border-black font-black uppercase text-xs hover:bg-black hover:text-white transition-colors"
                        onClick={() => initializeCards(user?.id || '')}
                    >
                        <Clock className="inline mr-2 h-4 w-4" strokeWidth={3} />
                        Refresh_Nodes
                    </button>
                    <button
                        onClick={openAddCard}
                        className="h-14 px-8 bg-black text-white font-black uppercase text-xs hover:bg-[#E11D48] transition-colors"
                    >
                        <Plus className="inline mr-2 h-5 w-5" strokeWidth={3} />
                        Issue_New_Node
                    </button>
                </div>
            </motion.header>

            {/* Overview Section */}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className={styles.overviewGrid}
            >
                {[
                    { icon: <CreditCard size={28} strokeWidth={3} />, label: "ACTIVE_NODES", value: cards.length, sub: "Digital Assets", progress: (cards.length / 5) * 100, color: "#000000" },
                    { icon: <Shield size={28} strokeWidth={3} />, label: "SECURITY_INTEGRITY", value: "100%", sub: "Encrypted", progress: 100, color: "#000000" },
                    { icon: <Landmark size={28} strokeWidth={3} />, label: "FINANCIAL_HUB", value: "READY", sub: "Digital Pay", progress: 100, color: "#E11D48" }
                ].map((stat, i) => (
                    <motion.div key={i} variants={itemVariants} className={styles.premiumStatCard}>
                        <div className={styles.statHeader}>
                            <div className={styles.statIconContainer}>
                                {stat.icon}
                            </div>
                            <div className={styles.secureBadge}>VERIFIED</div>
                        </div>
                        <div className={styles.statLabel}>{stat.label}</div>
                        <div className={styles.statValueContainer}>
                            <div className={styles.statValue} style={{ color: stat.color }}>{stat.value}</div>
                            <div className={styles.statSubtext}>{stat.sub}</div>
                        </div>
                        <div className={styles.statProgress}>
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${stat.progress}%` }}
                                className={styles.progressFill}
                                style={{ background: stat.color }}
                            />
                        </div>
                    </motion.div>
                ))}
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
                        <Building2 size={32} strokeWidth={3} />
                    </div>
                    <div className={styles.banksInfo}>
                        <h3>Linked Institutions</h3>
                        <p>EXTERNAL_FINANCIAL_NODES_MANIFEST</p>
                    </div>
                    <div className={styles.secureBadge}>ENCRYPTED_FLOW</div>
                </div>
                <div className={styles.banksContent}>
                    <LinkedAccountsCard />
                </div>
            </motion.div>

            {/* Wallet Section */}
            <div className={styles.walletSection}>
                <div className={styles.sectionHeader}>
                    <div className={styles.sectionTitle}>
                        <h2>Digital Wallet</h2>
                        <p>SECURE_VIRTUAL_ASSET_VAULT</p>
                    </div>
                    <div className={styles.sectionLine} />
                    <div className={styles.encryptedTag}>
                        <Lock size={14} strokeWidth={3} />
                        BANK_GRADE_ENCRYPTION
                    </div>
                </div>

                <div className={styles.cardsGrid}>
                    <motion.div
                        whileHover={{ scale: 1.02, translate: '-4px, -4px' }}
                        whileTap={{ scale: 0.98 }}
                        onClick={openAddCard}
                        className={styles.addCardTile}
                    >
                        <div className={styles.addCardIcon}>
                            <Plus size={40} strokeWidth={3} />
                        </div>
                        <span className={styles.addCardText}>Issue_New_Node</span>
                    </motion.div>

                    <AnimatePresence mode="popLayout">
                        {cards.map((card) => (
                            <PremiumCard
                                key={card.id}
                                card={card}
                                onClick={() => handleCardClick(card)}
                            />
                        ))}
                    </AnimatePresence>
                </div>
            </div>

            {/* Brutalist Card Details Modal */}
            <Dialog open={!!viewingCard} onOpenChange={() => setViewingCard(null)}>
                <AnimatePresence>
                    {viewingCard && (
                        <DialogContent className={styles.glassDialog}>
                            <div className={styles.modalHeader}>
                                <div className="absolute top-8 right-8 flex gap-3">
                                    {viewingCard.is_frozen && (
                                        <Badge className="bg-[#E11D48] text-white border-2 border-black font-black uppercase text-[10px] px-3 py-1">
                                            FROZEN
                                        </Badge>
                                    )}
                                    {viewingCard.is_default && (
                                        <Badge className="bg-black text-white border-2 border-black font-black uppercase text-[10px] px-3 py-1">
                                            DEFAULT
                                        </Badge>
                                    )}
                                </div>
                                <div className={styles.modalIcon}>
                                    {viewingCard.is_frozen ? <Snowflake size={32} strokeWidth={3} /> : <Target size={32} strokeWidth={3} />}
                                </div>
                                
                                {isEditingNickname ? (
                                    <div className="flex items-center gap-4 justify-center mt-6">
                                        <Input
                                            value={editedNickname}
                                            onChange={(e) => setEditedNickname(e.target.value)}
                                            className="h-12 w-60 border-4 border-black text-center font-black uppercase text-sm"
                                            autoFocus
                                        />
                                        <button className="h-12 px-6 bg-black text-white font-black" onClick={handleSaveNickname}>
                                            <Check size={20} strokeWidth={3} />
                                        </button>
                                    </div>
                                ) : (
                                    <DialogTitle className="text-3xl font-black uppercase italic tracking-tighter flex items-center justify-center gap-4 mt-6">
                                        {viewingCard.nickname || `${viewingCard.type.toUpperCase()} •••${viewingCard.last4}`}
                                        <button onClick={() => { setEditedNickname(viewingCard.nickname || ''); setIsEditingNickname(true); }}>
                                            <Pencil size={20} className="text-black/30 hover:text-black" strokeWidth={3} />
                                        </button>
                                    </DialogTitle>
                                )}
                                <DialogDescription className="text-black/50 font-black text-xs uppercase tracking-widest mt-2">
                                    {viewingCard.holder} // EXPIRES_{viewingCard.expiry}
                                </DialogDescription>
                            </div>

                            <div className={styles.modalContent}>
                                <div className="mb-10 flex justify-center">
                                    <PremiumCard card={viewingCard} showFullNumber={false} className="scale-110" />
                                </div>

                                <div className="bg-black text-white p-8 mb-8 border-4 border-black">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <DollarSign size={20} strokeWidth={3} />
                                            <span className="font-black text-xs uppercase tracking-widest">CYCLE_LIMIT</span>
                                        </div>
                                        {isEditingLimit ? (
                                            <div className="flex items-center gap-4">
                                                <Input
                                                    type="number"
                                                    value={editedLimit}
                                                    onChange={(e) => setEditedLimit(e.target.value)}
                                                    className="h-10 w-32 border-2 border-white bg-black text-white text-right font-black uppercase text-xs"
                                                />
                                                <button className="bg-white text-black p-2" onClick={handleSaveLimit}>
                                                    <Check size={16} strokeWidth={3} />
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                className="font-black text-xs uppercase text-[#E11D48] hover:underline"
                                                onClick={() => { setEditedLimit(viewingCard.spending_limit?.toString() || ''); setIsEditingLimit(true); }}
                                            >
                                                {viewingCard.spending_limit ? `RS ${viewingCard.spending_limit.toLocaleString()}` : 'SET_LIMIT'}
                                            </button>
                                        )}
                                    </div>
                                    {viewingCard.spending_limit && viewingCard.spending_limit > 0 && (
                                        <>
                                            <div className="h-6 bg-white/10 border-2 border-white overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${getSpendingProgress(viewingCard)}%` }}
                                                    className="h-full bg-[#E11D48]"
                                                />
                                            </div>
                                            <div className="flex justify-between mt-4 font-black text-[10px] uppercase tracking-widest">
                                                <span>OUTFLOW: RS {(viewingCard.total_spent || 0).toLocaleString()}</span>
                                                <span>{Math.round(getSpendingProgress(viewingCard))}%_UTILIZED</span>
                                            </div>
                                        </>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-8">
                                    <div className="bg-white border-4 border-black p-6 flex items-center gap-4">
                                        <Calendar size={24} strokeWidth={3} className="text-black/30" />
                                        <div>
                                            <div className="text-[10px] font-black uppercase text-black/30">LAST_ACTIVE</div>
                                            <div className="font-black text-sm">{formatLastUsed(viewingCard.last_used_at)}</div>
                                        </div>
                                    </div>
                                    <div className="bg-white border-4 border-black p-6 flex items-center gap-4">
                                        <BarChart3 size={24} strokeWidth={3} className="text-black/30" />
                                        <div>
                                            <div className="text-[10px] font-black uppercase text-black/30">MONTHLY_VOLUME</div>
                                            <div className="font-black text-sm">RS {(viewingCard.total_spent || 0).toLocaleString()}</div>
                                        </div>
                                    </div>

                                    <button
                                        className={cn(
                                            "h-16 border-4 border-black font-black uppercase text-xs flex items-center justify-center gap-3 transition-colors",
                                            viewingCard.is_frozen ? "bg-[#E11D48] text-white" : "bg-white text-black hover:bg-black hover:text-white"
                                        )}
                                        onClick={handleToggleFreeze}
                                    >
                                        <Snowflake size={20} strokeWidth={3} />
                                        {viewingCard.is_frozen ? 'UNFREEZE_NODE' : 'FREEZE_NODE'}
                                    </button>
                                    <button
                                        className={cn(
                                            "h-16 border-4 border-black font-black uppercase text-xs flex items-center justify-center gap-3 transition-colors",
                                            viewingCard.is_default ? "bg-black text-white" : "bg-white text-black hover:bg-black hover:text-white"
                                        )}
                                        onClick={handleSetDefault}
                                        disabled={viewingCard.is_default}
                                    >
                                        <Star size={20} strokeWidth={3} />
                                        {viewingCard.is_default ? 'DEFAULT_NODE' : 'SET_DEFAULT'}
                                    </button>
                                </div>

                                <div className={styles.vaultDetails}>
                                    <div className={styles.detailRow}>
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-black text-white flex items-center justify-center border-2 border-black">
                                                <CreditCard size={24} strokeWidth={3} />
                                            </div>
                                            <div>
                                                <span className={styles.infoLabel}>NODE_IDENTIFIER</span>
                                                <code className="text-sm font-black tracking-widest">
                                                    •••• •••• •••• {viewingCard.last4 || '****'}
                                                </code>
                                            </div>
                                        </div>
                                        <button className="p-3 hover:bg-black hover:text-white transition-colors" onClick={() => handleCopy(viewingCard.last4 || '')}>
                                            <Copy size={20} strokeWidth={3} />
                                        </button>
                                    </div>
                                </div>

                                {/* CVV Protection */}
                                <div className="bg-[#E11D48] text-white p-8 border-4 border-black mt-8 shadow-[8px_8px_0px_#000000]">
                                    <div className="flex items-center gap-3 mb-6">
                                        <Lock size={20} strokeWidth={3} />
                                        <span className="font-black text-sm uppercase tracking-widest">CVV_PROTECTION_PROTOCOL</span>
                                    </div>

                                    {isSettingCvvPassword ? (
                                        <div className="space-y-4">
                                            <Input
                                                type="password"
                                                placeholder="CVV (3-4 DIGITS)"
                                                value={cvvValue}
                                                onChange={(e) => setCvvValue(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                                className="h-12 border-2 border-white bg-black text-white text-center font-black tracking-[1em]"
                                                maxLength={4}
                                            />
                                            <Input
                                                type="password"
                                                placeholder="ACCESS_KEY (MIN_4_CHARS)"
                                                value={cvvPassword}
                                                onChange={(e) => setCvvPassword(e.target.value)}
                                                className="h-12 border-2 border-white bg-black text-white"
                                            />
                                            <div className="flex gap-4">
                                                <button className="flex-1 h-14 bg-white text-black font-black uppercase text-xs" onClick={handleSaveCvvPassword}>INITIALIZE_VAULT</button>
                                                <button className="px-6 border-2 border-white font-black uppercase text-xs" onClick={() => { setIsSettingCvvPassword(false); setCvvPassword(''); setConfirmCvvPassword(''); setCvvValue(''); }}>ABORT</button>
                                            </div>
                                        </div>
                                    ) : isVerifyingCvv ? (
                                        <div className="space-y-4">
                                            <Input
                                                type="password"
                                                placeholder="ENTER_ACCESS_KEY"
                                                value={cvvPassword}
                                                onChange={(e) => setCvvPassword(e.target.value)}
                                                className="h-12 border-2 border-white bg-black text-white"
                                                autoFocus
                                            />
                                            <div className="flex gap-4">
                                                <button className="flex-1 h-14 bg-white text-black font-black uppercase text-xs" onClick={handleVerifyCvv}>REVEAL_DATA</button>
                                                <button className="px-6 border-2 border-white font-black uppercase text-xs" onClick={() => { setIsVerifyingCvv(false); setCvvPassword(''); }}>ABORT</button>
                                            </div>
                                        </div>
                                    ) : cvvVerified ? (
                                        <div className="flex items-center justify-between bg-black p-6 border-2 border-white">
                                            <div className="flex items-center gap-6">
                                                <div className="text-3xl font-black tracking-[0.5em]">{cvvValue}</div>
                                                <div className="text-[10px] font-black uppercase text-white/50">HIDING_IN_{cvvTimer}S</div>
                                            </div>
                                            <button className="p-2 hover:text-[#E11D48]" onClick={() => handleCopy(cvvValue)}>
                                                <Copy size={20} strokeWidth={3} />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-black uppercase opacity-70">
                                                {viewingCard.cvv_password ? 'VAULT_ENCRYPTED' : 'VAULT_EMPTY'}
                                            </span>
                                            <button
                                                className="h-12 px-8 bg-white text-black font-black uppercase text-xs hover:bg-black hover:text-white transition-colors"
                                                onClick={() => viewingCard.cvv_password ? setIsVerifyingCvv(true) : setIsSettingCvvPassword(true)}
                                            >
                                                {viewingCard.cvv_password ? 'ACCESS_VAULT' : 'INIT_VAULT'}
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-4 mt-12">
                                    <button
                                        className="flex-1 h-16 bg-black text-white font-black uppercase text-sm hover:bg-[#E11D48] transition-colors"
                                        onClick={() => setViewingCard(null)}
                                    >
                                        TERMINATE_SESSION
                                    </button>
                                    <button
                                        className="h-16 w-16 border-4 border-black text-black hover:bg-[#E11D48] hover:text-white transition-colors flex items-center justify-center"
                                        onClick={handleDeleteCard}
                                    >
                                        <Trash2 size={24} strokeWidth={3} />
                                    </button>
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
