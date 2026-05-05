// TransactionsPage - Cashly Treasury Log (Premium Redesign)
// Midnight Coral Theme - Light Mode
import { lazy, Suspense, useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import {
    Search, Trash2, Edit2, ArrowRight, ArrowLeft,
    Download, FileUp, Brain, RefreshCw, RotateCcw,
    TrendingUp, TrendingDown, FileText, Receipt, Wallet, Activity,
    ChevronRight, Zap, Target, CreditCard, PieChart, Star
} from 'lucide-react';
import { useAuthStore } from '../store/useStore';
import { formatCurrency } from '../services/currencyService';
import { supabaseTransactionService, SupabaseTransaction } from '../services/supabaseTransactionService';
import { supabase } from '../config/supabase';
import { useTransactionRealtime } from '../hooks/useRealtimeSync';
import { toast } from 'sonner';
import TransactionDialog from '../components/TransactionDialog';
import ResetConfirmModal from '../components/ResetConfirmModal';
import { cn } from '@/lib/utils';
import { useSound } from '@/hooks/useSound';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import styles from './TransactionsPage.module.css';
import { TransactionsSkeleton } from '../components/LoadingSkeleton';

const CSVImport = lazy(() => import('../components/CSVImport'));
const ExportModal = lazy(() => import('../components/ExportModal'));
const PDFAnalyzer = lazy(() => import('../components/PDFAnalyzer'));
const DocumentImportModal = lazy(() => import('../components/DocumentImportModal'));

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
    const [dateRange, setDateRange] = useState<'all' | 'today' | 'week' | 'month'>('all');
    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');
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

    // Fetch transactions
    const fetchSupabaseTransactions = useCallback(async (options: { force?: boolean } = {}) => {
        if (!supabaseUserId) return;
        setIsLoadingSupabase(true);
        try {
            const transactions = await supabaseTransactionService.getAll(supabaseUserId, options);
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
        await fetchSupabaseTransactions({ force: true });
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

    // Canonical transaction data comes from Supabase so AI, imports, reports, and extension detections share one ledger.
    const allTransactions = useMemo(() => {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(startOfDay); startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay());
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return supabaseTransactions
            .filter(t => categoryFilter === 'all' || t.category === categoryFilter)
            .filter(t => !debouncedSearch || t.description.toLowerCase().includes(debouncedSearch.toLowerCase()))
            .filter(t => {
                if (dateRange === 'all') return true;
                const d = new Date(t.date);
                if (dateRange === 'today') return d >= startOfDay;
                if (dateRange === 'week') return d >= startOfWeek;
                if (dateRange === 'month') return d >= startOfMonth;
                return true;
            })
            .sort((a, b) => {
                if (sortOrder === 'newest') return new Date(b.date).getTime() - new Date(a.date).getTime();
                if (sortOrder === 'oldest') return new Date(a.date).getTime() - new Date(b.date).getTime();
                if (sortOrder === 'highest') return Math.abs(b.amount) - Math.abs(a.amount);
                if (sortOrder === 'lowest') return Math.abs(a.amount) - Math.abs(b.amount);
                return 0;
            });
    }, [supabaseTransactions, categoryFilter, debouncedSearch, dateRange, sortOrder]);


    // Derived Stats
    const totalIncome = allTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = allTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const balance = totalIncome - totalExpense;

    if (isLoadingSupabase && supabaseTransactions.length === 0) {
        return (
            <div className="w-full h-full p-8 flex items-center justify-center">
                <TransactionsSkeleton />
            </div>
        );
    }

    const CATEGORIES = ['Food', 'Shopping', 'Transport', 'Entertainment', 'Utilities', 'Health', 'Travel', 'Education', 'Other'];

    const categoryColors: Record<string, { bg: string; text: string; dot: string }> = {
        food:          { bg: 'rgba(245,158,11,0.12)',  text: '#d97706', dot: '#f59e0b' },
        shopping:      { bg: 'rgba(236,72,153,0.12)',  text: '#db2777', dot: '#ec4899' },
        transport:     { bg: 'rgba(59,130,246,0.12)',  text: '#2563eb', dot: '#3b82f6' },
        entertainment: { bg: 'rgba(124,58,237,0.12)',  text: '#7c3aed', dot: '#8b5cf6' },
        utilities:     { bg: 'rgba(20,184,166,0.12)',  text: '#0d9488', dot: '#14b8a6' },
        health:        { bg: 'rgba(34,197,94,0.12)',   text: '#16a34a', dot: '#22c55e' },
        travel:        { bg: 'rgba(249,115,22,0.12)',  text: '#ea580c', dot: '#f97316' },
        education:     { bg: 'rgba(99,102,241,0.12)', text: '#4f46e5', dot: '#6366f1' },
        other:         { bg: 'rgba(148,163,184,0.12)', text: '#64748b', dot: '#94a3b8' },
    };

    const getCategoryStyle = (cat: string) => {
        const key = (cat || 'other').toLowerCase();
        return categoryColors[key] || categoryColors['other'];
    };

    return (
        <div style={{ background: 'var(--bg-page)', minHeight: '100vh', padding: '2rem 2.5rem' }}>
            <motion.div
                style={{ maxWidth: '1320px', margin: '0 auto' }}
                variants={staggerContainer}
                initial="hidden"
                animate="show"
            >

                {/* â”€â”€ PAGE HEADER â”€â”€ */}
                <motion.div
                    variants={fadeInUp}
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '2rem',
                        flexWrap: 'wrap',
                        gap: '1rem',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{
                            width: '3rem', height: '3rem', borderRadius: '0',
                            background: '#E11D48', border: '2px solid #000000',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'white', boxShadow: '4px 4px 0px #000000',
                        }}>
                            <Receipt size={20} />
                        </div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.03em', margin: 0 }}>
                                    Treasury Log
                                </h1>
                                <span style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                                    fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em',
                                    padding: '0.25rem 0.75rem', borderRadius: '2rem',
                                    background: 'rgba(34,197,94,0.12)', color: '#16a34a',
                                    border: '1px solid rgba(34,197,94,0.25)',
                                }}>
                                    <span style={{
                                        width: '6px', height: '6px', borderRadius: '50%',
                                        background: '#22c55e', animation: 'pulse 2s infinite',
                                        display: 'inline-block',
                                    }} />
                                    LIVE SYNC
                                </span>
                            </div>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, margin: '0.2rem 0 0', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                                {allTransactions.length} records · Financial Ledger
                            </p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap' }}>
                        {[
                            { label: 'AI Import', icon: <Brain size={15} />, onClick: () => setShowAIImport(true), style: { background: '#000000', color: '#fff', border: '2px solid #E11D48', boxShadow: '4px 4px 0px #E11D48' } },
                            { label: 'Export', icon: <Download size={15} />, onClick: () => setShowExport(true), style: { background: '#FFFFFF', color: '#000000', border: '2px solid #000000', boxShadow: '4px 4px 0px #000000' } },
                            { label: 'Reset', icon: <Trash2 size={15} />, onClick: () => setShowResetModal(true), style: { background: '#E11D48', color: '#FFFFFF', border: '2px solid #000000', boxShadow: '4px 4px 0px #000000' } },
                        ].map(btn => (
                            <motion.button
                                key={btn.label}
                                whileHover={{ scale: 1.04, y: -1 }}
                                whileTap={{ scale: 0.96 }}
                                onClick={btn.onClick}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                                    padding: '0.55rem 1.1rem', borderRadius: '0.75rem',
                                    fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer',
                                    transition: 'all 0.2s', ...btn.style,
                                }}
                            >
                                {btn.icon}{btn.label}
                            </motion.button>
                        ))}
                        <motion.button
                            whileHover={{ scale: 1.04, y: -1 }}
                            whileTap={{ scale: 0.96 }}
                            onClick={refreshTransactions}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                padding: '0.55rem 1.1rem', borderRadius: '0',
                                background: '#FFFFFF', color: '#000000',
                                border: '2px solid #000000', boxShadow: '4px 4px 0px #000000', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer',
                            }}
                        >
                            <RefreshCw size={15} className={isLoadingSupabase ? styles.spinning : ''} /> Refresh
                        </motion.button>
                    </div>
                </motion.div>

                {/* â”€â”€ STAT CARDS â”€â”€ */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1.25rem', marginBottom: '2rem' }}>
                    {[
                        {
                            label: 'Total Inflow', value: formatCurrency(totalIncome), 
                            icon: <TrendingUp size={22} />,
                            gradient: '#FFFFFF',
                            iconBg: '#000000', iconColor: '#FFFFFF',
                            valueColor: '#000000', borderColor: '#000000',
                            suffix: '↑ Income',
                        },
                        {
                            label: 'Total Outflow', value: formatCurrency(totalExpense),
                            icon: <TrendingDown size={22} />,
                            gradient: '#FFFFFF',
                            iconBg: '#E11D48', iconColor: '#FFFFFF',
                            valueColor: '#E11D48', borderColor: '#000000',
                            prefix: '-', suffix: '↓ Expense',
                        },
                        {
                            label: 'Net Balance', value: formatCurrency(Math.abs(balance)),
                            icon: <Wallet size={22} />,
                            gradient: '#FFFFFF',
                            iconBg: '#000000',
                            iconColor: '#FFFFFF',
                            valueColor: balance >= 0 ? '#000000' : '#E11D48',
                            borderColor: '#000000',
                            prefix: balance < 0 ? '-' : '',
                            suffix: balance >= 0 ? '✦ Surplus' : '⚠ Deficit',
                        },
                    ].map((card, i) => (
                        <motion.div
                            key={i}
                            variants={fadeInUp}
                            whileHover={{ y: -4, boxShadow: '12px 12px 0px rgba(0,0,0,1)' }}
                            style={{
                                background: card.gradient,
                                border: `3px solid ${card.borderColor}`,
                                borderRadius: '0',
                                padding: '1.75rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1.25rem',
                                transition: 'all 0.2s',
                                boxShadow: '8px 8px 0px rgba(0,0,0,1)',
                                cursor: 'default',
                            }}
                        >
                            <div style={{
                                width: '3.25rem', height: '3.25rem', borderRadius: '0',
                                background: card.iconBg, color: card.iconColor, border: '2px solid #000000',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0, boxShadow: `4px 4px 0px ${card.iconBg}`,
                            }}>
                                {card.icon}
                            </div>
                            <div>
                                <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>{card.label}</p>
                                <h3 style={{ fontSize: '1.75rem', fontWeight: 900, color: card.valueColor, letterSpacing: '-0.04em', lineHeight: 1.1, margin: '0.25rem 0 0.2rem' }}>
                                    {card.prefix || ''}{card.value}
                                </h3>
                                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: card.iconColor, opacity: 0.85 }}>{card.suffix}</span>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* â”€â”€ MAIN LEDGER PANEL â”€â”€ */}
                <motion.div
                    variants={fadeInUp}
                    style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        borderRadius: '1.25rem',
                        overflow: 'hidden',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
                    }}
                >
                    {/* Panel Toolbar */}
                    <div style={{
                        display: 'flex', gap: '0.875rem', padding: '1.25rem 1.5rem',
                        borderBottom: '1px solid var(--border)',
                        background: 'var(--bg-subtle)',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                    }}>
                        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                            <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={16} />
                            <input
                                style={{
                                    width: '100%', height: '2.6rem', paddingLeft: '2.75rem', paddingRight: '1rem',
                                    background: 'var(--bg-card)', border: '1px solid var(--border)',
                                    borderRadius: '0.75rem', color: 'var(--text-primary)',
                                    fontSize: '0.875rem', fontWeight: 500, outline: 'none',
                                    transition: 'border-color 0.2s, box-shadow 0.2s',
                                    boxSizing: 'border-box',
                                }}
                                placeholder="Search transactions..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.12)'; }}
                                onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
                            />
                        </div>
                        <select
                            style={{
                                height: '2.6rem', padding: '0 2.5rem 0 1rem',
                                background: 'var(--bg-card)', border: '1px solid var(--border)',
                                borderRadius: '0.75rem', color: 'var(--text-primary)',
                                fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer',
                                outline: 'none', appearance: 'none',
                                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236366f1' stroke-width='2.5'%3e%3cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7' /%3e%3c/svg%3e")`,
                                backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.875rem center', backgroundSize: '0.875rem',
                            }}
                            value={categoryFilter}
                            onChange={(e) => { setCategoryFilter(e.target.value); sound.playClick(); }}
                        >
                            <option value="all">All Categories</option>
                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>

                        {/* Date Range Quick Filters */}
                        <div style={{ display: 'flex', gap: '0.375rem', background: '#f1f5f9', border: '2px solid #000000', padding: '3px' }}>
                            {(['all', 'today', 'week', 'month'] as const).map(range => (
                                <button
                                    key={range}
                                    onClick={() => { setDateRange(range); setPage(1); sound.playClick(); }}
                                    style={{
                                        padding: '0.3rem 0.75rem',
                                        fontSize: '0.72rem', fontWeight: 800,
                                        letterSpacing: '0.07em', textTransform: 'uppercase',
                                        border: dateRange === range ? '2px solid #000000' : '2px solid transparent',
                                        background: dateRange === range ? '#E11D48' : 'transparent',
                                        color: dateRange === range ? '#FFFFFF' : '#64748b',
                                        cursor: 'pointer',
                                        transition: 'all 0.15s',
                                        boxShadow: dateRange === range ? '2px 2px 0px #000000' : 'none',
                                    }}
                                >
                                    {range === 'all' ? 'All' : range === 'today' ? 'Today' : range === 'week' ? 'Week' : 'Month'}
                                </button>
                            ))}
                        </div>

                        {/* Sort Order */}
                        <select
                            style={{
                                height: '2.4rem', padding: '0 2rem 0 0.75rem',
                                background: '#FFFFFF', border: '2px solid #000000',
                                color: '#000000', fontSize: '0.78rem', fontWeight: 700,
                                cursor: 'pointer', outline: 'none', appearance: 'none',
                                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23000000' stroke-width='2.5'%3e%3cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7' /%3e%3c/svg%3e")`,
                                backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center', backgroundSize: '0.8rem',
                                boxShadow: '4px 4px 0px #000000',
                            }}
                            value={sortOrder}
                            onChange={e => { setSortOrder(e.target.value as any); setPage(1); sound.playClick(); }}
                        >
                            <option value="newest">↓ Newest</option>
                            <option value="oldest">↑ Oldest</option>
                            <option value="highest">↓ Highest</option>
                            <option value="lowest">↑ Lowest</option>
                        </select>

                        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                                {allTransactions.length} RECORDS
                            </span>
                        </div>

                    </div>

                    {/* Column Headers */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '2.5rem 1fr auto auto',
                        gap: '0.75rem',
                        padding: '0.65rem 1.5rem',
                        borderBottom: '1px solid var(--border)',
                        fontSize: '0.7rem', fontWeight: 800,
                        color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase',
                        background: 'rgba(99,102,241,0.04)',
                    }}>
                        <div />
                        <div>Transaction</div>
                        <div style={{ textAlign: 'right', paddingRight: '3rem' }}>Amount</div>
                        <div style={{ width: '4rem' }} />
                    </div>

                    {/* Transaction Rows */}
                    <div>
                        <AnimatePresence mode="popLayout">
                            {allTransactions.length > 0 ? (
                                allTransactions.slice((page - 1) * 10, page * 10).map((transaction: any, index: number) => {
                                    const catStyle = getCategoryStyle(transaction.category?.name || transaction.category || 'other');
                                    const isExpense = transaction.type === 'expense';
                                    return (
                                        <motion.div
                                            key={transaction.id || `tx-${index}`}
                                            variants={itemVariants}
                                            initial="hidden"
                                            animate="show"
                                            exit={{ opacity: 0, x: 20 }}
                                            layout
                                            style={{
                                                display: 'grid',
                                                gridTemplateColumns: '2.5rem 1fr auto auto',
                                                gap: '0.75rem',
                                                padding: '1rem 1.5rem',
                                                borderBottom: '1px solid var(--border)',
                                                alignItems: 'center',
                                                transition: 'background 0.2s',
                                                cursor: 'default',
                                                position: 'relative',
                                            }}
                                            whileHover={{ backgroundColor: 'var(--bg-subtle)' }}
                                            className="group"
                                        >
                                            {/* Type Icon */}
                                            <div style={{
                                                width: '2.25rem', height: '2.25rem', borderRadius: '0.625rem',
                                                background: isExpense ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                                                color: isExpense ? '#ef4444' : '#10b981',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                flexShrink: 0,
                                            }}>
                                                {isExpense ? <TrendingDown size={15} strokeWidth={2.5} /> : <TrendingUp size={15} strokeWidth={2.5} />}
                                            </div>

                                            {/* Info */}
                                            <div style={{ minWidth: 0 }}>
                                                <div style={{
                                                    fontWeight: 700, fontSize: '0.9rem',
                                                    color: 'var(--text-primary)',
                                                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                                    marginBottom: '0.3rem',
                                                }}>
                                                    {transaction.description}
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                                                    <span style={{
                                                        fontSize: '0.68rem', fontWeight: 800,
                                                        padding: '0.2rem 0.6rem', borderRadius: '0.375rem',
                                                        background: catStyle.bg, color: catStyle.text,
                                                        letterSpacing: '0.06em', textTransform: 'uppercase',
                                                    }}>
                                                        {transaction.category?.name || transaction.category || 'Other'}
                                                    </span>
                                                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                                                        {format(new Date(transaction.date), 'MMM dd, yyyy')}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Amount */}
                                            <div style={{ textAlign: 'right' }}>
                                                <span style={{
                                                    fontSize: '1.05rem', fontWeight: 900,
                                                    color: isExpense ? '#ef4444' : '#10b981',
                                                    letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums',
                                                }}>
                                                    {isExpense ? '-' : '+'}{formatCurrency(Math.abs(transaction.amount))}
                                                </span>
                                            </div>

                                            {/* Actions */}
                                            <div style={{ display: 'flex', gap: '0.375rem', opacity: 0 }} className={styles.txActions}>
                                                <button
                                                    onClick={() => setSelectedTransaction(transaction)}
                                                    style={{
                                                        width: '2rem', height: '2rem', borderRadius: '0.5rem',
                                                        background: 'var(--bg-card)', border: '1px solid var(--border)',
                                                        color: 'var(--text-muted)', cursor: 'pointer',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        transition: 'all 0.15s',
                                                    }}
                                                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#6366f1'; (e.currentTarget as HTMLElement).style.borderColor = '#6366f1'; }}
                                                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; }}
                                                >
                                                    <Edit2 size={13} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(transaction.id)}
                                                    style={{
                                                        width: '2rem', height: '2rem', borderRadius: '0.5rem',
                                                        background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)',
                                                        color: '#ef4444', cursor: 'pointer',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        transition: 'all 0.15s',
                                                    }}
                                                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.14)'; }}
                                                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.06)'; }}
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>
                                        </motion.div>
                                    );
                                })
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    style={{ padding: '5rem 2rem', textAlign: 'center' }}
                                >
                                    <div style={{
                                        width: '4.5rem', height: '4.5rem', margin: '0 auto 1.25rem',
                                        background: 'rgba(99,102,241,0.08)', border: '2px dashed rgba(99,102,241,0.2)',
                                        borderRadius: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: '#6366f1',
                                    }}>
                                        <FileText size={28} />
                                    </div>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 0.5rem' }}>No records found</h3>
                                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', maxWidth: '24rem', margin: '0 auto' }}>
                                        Try adjusting your search or category filter, or add a new transaction.
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Pagination */}
                    {allTransactions.length > 10 && (
                        <div style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '1rem 1.5rem', borderTop: '3px solid #000000',
                            background: '#FFFFFF',
                        }}>
                            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#000000', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                                Showing {(page - 1) * 10 + 1}–{Math.min(page * 10, allTransactions.length)} of {allTransactions.length}
                            </span>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                {[
                                    { label: '← Prev', onClick: () => { setPage(p => Math.max(1, p - 1)); sound.playClick(); }, disabled: page === 1 },
                                    { label: 'Next →', onClick: () => { setPage(p => p + 1); sound.playClick(); }, disabled: page >= Math.ceil(allTransactions.length / 10) },
                                ].map(btn => (
                                    <button
                                        key={btn.label}
                                        onClick={btn.onClick}
                                        disabled={btn.disabled}
                                        style={{
                                            padding: '0.45rem 1.1rem', borderRadius: '0',
                                            fontSize: '0.8rem', fontWeight: 700, cursor: btn.disabled ? 'not-allowed' : 'pointer',
                                            background: btn.disabled ? '#f1f5f9' : '#000000',
                                            color: btn.disabled ? '#94a3b8' : '#FFFFFF',
                                            border: '2px solid #000000',
                                            boxShadow: btn.disabled ? 'none' : '4px 4px 0px #E11D48',
                                            opacity: btn.disabled ? 0.5 : 1,
                                            transition: 'all 0.15s',
                                        }}
                                    >{btn.label}</button>
                                ))}
                            </div>
                        </div>
                    )}
                </motion.div>

            </motion.div>

            {/* â”€â”€ MODALS â”€â”€ */}
            <AnimatePresence>
                <Suspense fallback={null}>
                    {showImport && <CSVImport key="csv-import" onImport={refreshTransactions} onClose={() => setShowImport(false)} />}
                    {showPDFAnalyzer && <PDFAnalyzer key="pdf-analyzer" onComplete={refreshTransactions} onClose={() => setShowPDFAnalyzer(false)} />}
                    {showExport && <ExportModal key="export-modal" onClose={() => setShowExport(false)} transactions={allTransactions} />}
                </Suspense>
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
                    onResetComplete={() => { window.location.reload(); }}
                />
                {showAIImport && (
                    <Suspense fallback={null}>
                        <DocumentImportModal
                            key="document-import"
                            isOpen={showAIImport}
                            onClose={() => setShowAIImport(false)}
                            onImportComplete={() => { fetchSupabaseTransactions(); }}
                        />
                    </Suspense>
                )}
            </AnimatePresence>
        </div>
    );
};

export default TransactionsPage;
