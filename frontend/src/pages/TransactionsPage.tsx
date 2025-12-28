// TransactionsPage - Cashly Treasury Log (Premium Redesign)
// Midnight Coral Theme - Light Mode
import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import {
    Search, Trash2, Edit2, ArrowRight, ArrowLeft,
    Download, FileUp, Brain, RefreshCw, RotateCcw,
    TrendingUp, TrendingDown, FileText, Receipt, Wallet, Activity,
    ChevronRight, Zap, Target, CreditCard, PieChart, Star
} from 'lucide-react';
import { useTransactions, useDeleteTransaction } from '../hooks/useTransactions';
import { useAuthStore } from '../store/useStore';
import { formatCurrency } from '../services/currencyService';
import { supabaseTransactionService, SupabaseTransaction } from '../services/supabaseTransactionService';
import { supabase } from '../config/supabase';
import { useTransactionRealtime } from '../hooks/useRealtimeSync';
import { toast } from 'sonner';
import TransactionDialog from '../components/TransactionDialog';
import CSVImport from '../components/CSVImport';
import ExportModal from '../components/ExportModal';
import PDFAnalyzer from '../components/PDFAnalyzer';
import ResetConfirmModal from '../components/ResetConfirmModal';
import DocumentImportModal from '../components/DocumentImportModal';
import { cn } from '@/lib/utils';
import { useSound } from '@/hooks/useSound';
import { Badge } from '@/components/ui/badge';
import styles from './TransactionsPage.module.css';
import { TransactionsSkeleton } from '../components/LoadingSkeleton';

// Animation Variants
const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    show: {
        opacity: 1,
        y: 0,
        transition: { type: 'spring', damping: 25, stiffness: 100 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    show: {
        opacity: 1,
        x: 0,
        transition: { type: 'spring', damping: 20, stiffness: 100 }
    }
};

const iconAnim = {
    animate: {
        y: [0, -6, 0],
        rotate: [0, 5, 0],
        transition: { duration: 4, repeat: Infinity, ease: "easeInOut" }
    }
};

const TransactionsPage = () => {
    const { user } = useAuthStore();
    const sound = useSound();

    // State
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [supabaseTransactions, setSupabaseTransactions] = useState<SupabaseTransaction[]>([]);
    const [isLoadingSupabase, setIsLoadingSupabase] = useState(false);
    const [supabaseUserId, setSupabaseUserId] = useState<string | null>(null);

    // Modals
    const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
    const [showImport, setShowImport] = useState(false);
    const [showPDFAnalyzer, setShowPDFAnalyzer] = useState(false);
    const [showExport, setShowExport] = useState(false);
    const [showResetModal, setShowResetModal] = useState(false);
    const [showAIImport, setShowAIImport] = useState(false);

    // Get Supabase User
    useEffect(() => {
        const getSupabaseUser = async () => {
            const { data: { user: supaUser } } = await supabase.auth.getUser();
            if (supaUser) setSupabaseUserId(supaUser.id);
            else if (user?.id) setSupabaseUserId(user.id);
        };
        getSupabaseUser();
    }, [user]);

    // Query Hook
    const { data, isLoading } = useTransactions({
        page,
        limit: 10,
        search: search || undefined,
        categoryId: categoryFilter !== 'all' ? categoryFilter : undefined
    });

    const deleteMutation = useDeleteTransaction();

    // Fetch transactions
    const fetchSupabaseTransactions = useCallback(async () => {
        if (!supabaseUserId) return;
        setIsLoadingSupabase(true);
        try {
            const transactions = await supabaseTransactionService.getAll(supabaseUserId);
            setSupabaseTransactions(transactions);
        } catch (error) {
            console.error('Failed to fetch from Supabase:', error);
        } finally {
            setIsLoadingSupabase(false);
        }
    }, [supabaseUserId]);

    useEffect(() => {
        fetchSupabaseTransactions();
    }, [fetchSupabaseTransactions]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    const refreshTransactions = async () => {
        await fetchSupabaseTransactions();
        toast.success('Ledger Refreshed', { description: 'Latest transaction data synchronized.' });
        sound.playSuccess();
    };

    useTransactionRealtime({
        onInsert: (tx: any) => {
            setSupabaseTransactions(prev => {
                if (prev.some(t => t.id === tx.id)) return prev;
                return [tx, ...prev];
            });
            sound.playSuccess();
        },
        onUpdate: (tx: any) => {
            setSupabaseTransactions(prev =>
                prev.map(t => t.id === tx.id ? { ...t, ...tx } : t)
            );
        },
        onDelete: (id: string) => {
            setSupabaseTransactions(prev => prev.filter(t => t.id !== id));
        }
    });

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this transaction?')) return;
        try {
            await supabaseTransactionService.delete(id);
            setSupabaseTransactions(prev => prev.filter(t => t.id !== id));
            await deleteMutation.mutateAsync(id).catch(() => { });
            setSelectedTransaction(null);
            sound.playClick();
        } catch (error) {
            console.error('Delete failed:', error);
            toast.error('Operation Failed');
        }
    };

    const handleUpdate = async (transaction: any) => {
        try {
            const updated = await supabaseTransactionService.update(transaction.id, {
                description: transaction.description,
                amount: transaction.amount,
                category: transaction.category,
                type: transaction.type,
                date: transaction.date,
            });
            if (updated) {
                setSupabaseTransactions(prev =>
                    prev.map(t => t.id === transaction.id ? { ...t, ...updated } : t)
                );
            }
            setSelectedTransaction(null);
            sound.playSuccess();
        } catch (error) {
            console.error('Update failed:', error);
            toast.error('Modification failed');
        }
    };

    // Combine & Filter Data
    const apiTransactions = (data as any)?.transactions || [];
    const apiIds = new Set(apiTransactions.map((t: any) => t.id));
    const uniqueSupabaseTransactions = supabaseTransactions.filter(t => !apiIds.has(t.id));

    const allTransactions = useMemo(() => {
        return [...uniqueSupabaseTransactions, ...apiTransactions]
            .filter(t => categoryFilter === 'all' || (t.category?.name === categoryFilter || t.category === categoryFilter))
            .filter(t => !debouncedSearch || t.description.toLowerCase().includes(debouncedSearch.toLowerCase()))
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [uniqueSupabaseTransactions, apiTransactions, categoryFilter, debouncedSearch]);

    // Derived Stats
    const totalIncome = allTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = allTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const balance = totalIncome - totalExpense;

    if (isLoading || (isLoadingSupabase && supabaseTransactions.length === 0)) {
        return (
            <div className={styles.mainContent}>
                <TransactionsSkeleton />
            </div>
        );
    }

    return (
        <div className={styles.mainContent}>
            <motion.div
                className={styles.contentArea}
                variants={staggerContainer}
                initial="hidden"
                animate="show"
            >
                {/* Premium Glass Header */}
                <motion.header
                    className={styles.header}
                    initial={{ opacity: 0, y: -40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: 'spring', damping: 20 }}
                >
                    <div className={styles.headerLeft}>
                        <motion.div
                            className={styles.titleIcon}
                            whileHover={{ scale: 1.1, rotate: 10 }}
                        >
                            <Receipt size={28} />
                        </motion.div>
                        <div>
                            <h1 className={styles.title}>
                                Treasury Log
                                <div className={styles.liveBadge}>
                                    <div className={styles.pulseDot}></div>
                                    REAL-TIME SYNC
                                </div>
                            </h1>
                            <p className={styles.listSubtitle}>Monitoring your financial ecosystem</p>
                        </div>
                    </div>

                    <div className={styles.headerActions}>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={styles.labelBtn}
                            onClick={refreshTransactions}
                        >
                            <RefreshCw size={20} className={isLoadingSupabase ? styles.spinning : ''} />
                            <span>Refresh</span>
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-blue-200"
                            onClick={() => setShowAIImport(true)}
                            title="AI Document Import"
                        >
                            <Brain size={18} />
                            <span>AI Import</span>
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            className={styles.exportBtn}
                            onClick={() => setShowExport(true)}
                        >
                            <Download size={20} />
                            <span>Export</span>
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="flex items-center gap-2 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl font-bold text-sm transition-all border-2 border-rose-100"
                            onClick={() => setShowResetModal(true)}
                            title="Reset All Transactions"
                        >
                            <RotateCcw size={18} />
                            <span>Reset</span>
                        </motion.button>
                    </div>
                </motion.header>

                {/* Intensified Stats Grid */}
                <div className={styles.statsRow}>
                    <motion.div className={cn(styles.premiumStatCard, styles.income)} variants={fadeInUp}>
                        <div className={styles.statMesh} />
                        <motion.div {...iconAnim} className={styles.statIconBox}>
                            <TrendingUp size={28} />
                        </motion.div>
                        <h3 className={styles.statValue}>{formatCurrency(totalIncome)}</h3>
                        <p className={styles.statLabel}>Accumulated Inflow</p>
                    </motion.div>

                    <motion.div className={cn(styles.premiumStatCard, styles.expenses)} variants={fadeInUp}>
                        <div className={styles.statMesh} />
                        <motion.div {...iconAnim} className={styles.statIconBox}>
                            <TrendingDown size={28} />
                        </motion.div>
                        <h3 className={styles.statValue}>-{formatCurrency(totalExpense)}</h3>
                        <p className={styles.statLabel}>Total Consumption</p>
                    </motion.div>

                    <motion.div className={cn(styles.premiumStatCard, styles.balance)} variants={fadeInUp}>
                        <div className={styles.statMesh} />
                        <motion.div {...iconAnim} className={styles.statIconBox}>
                            <Wallet size={28} />
                        </motion.div>
                        <h3 className={styles.statValue} style={{ color: balance >= 0 ? '#10b981' : '#e11d48' }}>
                            {formatCurrency(balance)}
                        </h3>
                        <p className={styles.statLabel}>Treasury Balance</p>
                    </motion.div>
                </div>

                {/* Filters Row */}
                <motion.div className={styles.filtersRow} variants={fadeInUp}>
                    <div className={styles.searchContainer}>
                        <input
                            type="text"
                            className={styles.searchInput}
                            placeholder="Search by description or merchant..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <Search className={styles.searchIcon} size={22} />
                    </div>
                    <select
                        className={styles.categorySelect}
                        value={categoryFilter}
                        onChange={(e) => { setCategoryFilter(e.target.value); sound.playClick(); }}
                    >
                        <option value="all">Global Explorer</option>
                        {['Food', 'Shopping', 'Transport', 'Entertainment', 'Utilities', 'Health', 'Travel', 'Education'].map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </motion.div>

                {/* Activity List */}
                <div className={styles.transactionList}>
                    <div className={styles.listHeader}>
                        <div>
                            <h3 className={styles.listTitle}>Activity History</h3>
                            <p className={styles.listSubtitle}>Detailed Financial Ledger</p>
                        </div>
                        <Badge variant="outline" className="h-9 px-5 border-2 border-slate-200 bg-slate-50/50 text-slate-600 font-black tracking-widest uppercase text-[11px] rounded-xl">
                            {allTransactions.length} TOTAL RECORDS
                        </Badge>
                    </div>

                    <div className="flex flex-col gap-1">
                        <AnimatePresence mode="popLayout">
                            {allTransactions.length > 0 ? (
                                allTransactions.slice((page - 1) * 10, page * 10).map((transaction: any, index: number) => (
                                    <motion.div
                                        key={transaction.id || `tx-fallback-${index}-${transaction.date}-${transaction.amount}`}
                                        className={styles.transactionCard}
                                        variants={itemVariants}
                                        initial="hidden"
                                        animate="show"
                                        exit={{ opacity: 0, scale: 0.95, x: 20 }}
                                        layout
                                    >
                                        <div className={cn(styles.txIcon, styles[`cat-${(transaction.category?.name || transaction.category || '').toLowerCase()}`])}>
                                            {transaction.type === 'expense' ? <TrendingDown size={24} /> : <TrendingUp size={24} />}
                                        </div>
                                        <div className={styles.txContent}>
                                            <h4 className={styles.txTitle}>{transaction.description}</h4>
                                            <div className={styles.txMeta}>
                                                <span className={cn(styles.txCategoryBadge, styles[`cat-${(transaction.category?.name || transaction.category || '').toLowerCase()}`])}>
                                                    {transaction.category?.name || transaction.category || 'Legacy'}
                                                </span>
                                                <span className={styles.txDate}>
                                                    {format(new Date(transaction.date), 'MMM dd, yyyy • HH:mm')}
                                                </span>
                                            </div>
                                        </div>
                                        <div className={cn(styles.txAmount, styles[transaction.type])}>
                                            <motion.span
                                                initial={{ scale: 0.9 }}
                                                animate={{ scale: 1 }}
                                            >
                                                {transaction.type === 'expense' ? '-' : '+'}{formatCurrency(Math.abs(transaction.amount))}
                                            </motion.span>
                                        </div>
                                        <div className={styles.txActions}>
                                            <motion.button
                                                whileHover={{ scale: 1.1, rotate: 5 }}
                                                whileTap={{ scale: 0.9 }}
                                                className={styles.actionIconBtn}
                                                onClick={() => setSelectedTransaction(transaction)}
                                            >
                                                <Edit2 size={18} strokeWidth={2.5} />
                                            </motion.button>
                                            <motion.button
                                                whileHover={{ scale: 1.1, rotate: -5 }}
                                                whileTap={{ scale: 0.9 }}
                                                className={styles.actionIconBtn}
                                                onClick={() => handleDelete(transaction.id)}
                                            >
                                                <Trash2 size={18} strokeWidth={2.5} />
                                            </motion.button>
                                        </div>
                                    </motion.div>
                                ))
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className={styles.emptyState}
                                >
                                    <div className={styles.emptyIcon}>
                                        <FileText size={48} strokeWidth={1.5} />
                                    </div>
                                    <h3 className={styles.listTitle}>No records detected</h3>
                                    <p className={styles.listSubtitle}>Expand your search or import new financial data.</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {allTransactions.length > 10 && (
                        <motion.div className={styles.pagination} variants={fadeInUp}>
                            <motion.button
                                whileHover={{ scale: 1.05, x: -5 }}
                                whileTap={{ scale: 0.95 }}
                                className={styles.pageBtn}
                                onClick={() => { setPage(p => Math.max(1, p - 1)); sound.playClick(); }}
                                disabled={page === 1}
                            >
                                <ArrowLeft size={18} strokeWidth={3} /> Previous
                            </motion.button>
                            <span className={styles.currentPage}>
                                {page} <span className="opacity-50 mx-1">/</span> {Math.ceil(allTransactions.length / 10)}
                            </span>
                            <motion.button
                                whileHover={{ scale: 1.05, x: 5 }}
                                whileTap={{ scale: 0.95 }}
                                className={styles.pageBtn}
                                onClick={() => { setPage(p => p + 1); sound.playClick(); }}
                                disabled={page >= Math.ceil(allTransactions.length / 10)}
                            >
                                Next <ArrowRight size={18} strokeWidth={3} />
                            </motion.button>
                        </motion.div>
                    )}
                </div>

                {/* Premium Modals */}
                <AnimatePresence>
                    {showImport && <CSVImport key="csv-import" onImport={refreshTransactions} onClose={() => setShowImport(false)} />}
                    {showPDFAnalyzer && <PDFAnalyzer key="pdf-analyzer" onComplete={refreshTransactions} onClose={() => setShowPDFAnalyzer(false)} />}
                    {showExport && <ExportModal key="export-modal" onClose={() => setShowExport(false)} transactions={allTransactions} />}
                    {selectedTransaction && (
                        <TransactionDialog
                            key="transaction-dialog"
                            transaction={selectedTransaction}
                            onSave={handleUpdate}
                            onDelete={handleDelete}
                            onClose={() => setSelectedTransaction(null)}
                        />
                    )}
                    <ResetConfirmModal
                        key="reset-modal"
                        isOpen={showResetModal}
                        onClose={() => setShowResetModal(false)}
                        category="transactions"
                        categoryLabel="Transactions"
                        onResetComplete={() => {
                            // Force full page reload to clear all cache
                            window.location.reload();
                        }}
                    />
                    <DocumentImportModal
                        key="document-import"
                        isOpen={showAIImport}
                        onClose={() => setShowAIImport(false)}
                        onImportComplete={() => {
                            fetchSupabaseTransactions();
                        }}
                    />
                </AnimatePresence>
            </motion.div>
        </div>
    );
};

export default TransactionsPage;
