// Transactions Page - Gen Z Edition with CSV & PDF Import
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { Search, Plus, Trash2, Edit2, Filter, ArrowRight, ShoppingBag, ArrowLeft, Upload, Download, FileUp, Brain, RefreshCw } from 'lucide-react';
import { useTransactions, useDeleteTransaction, useUpdateTransaction } from '../hooks/useTransactions';
import { useModalStore, useAuthStore } from '../store/useStore';
import { formatCurrency, getCurrencyCode } from '../services/currencyService';
import { supabaseTransactionService, SupabaseTransaction } from '../services/supabaseTransactionService';
import { supabase } from '../config/supabase';
import CSVImport from '../components/CSVImport';
import PDFAnalyzer from '../components/PDFAnalyzer';
import TransactionDialog from '../components/TransactionDialog';
import ExportModal from '../components/ExportModal';
import { ParsedTransaction } from '../services/csvImportService';
import { ExtractedTransaction } from '../services/pdfAnalyzerService';
import styles from './TransactionsPage.module.css';
import genZToast from '../services/genZToast';

const TransactionsPage = () => {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [showImport, setShowImport] = useState(false);
    const [showPDFAnalyzer, setShowPDFAnalyzer] = useState(false);
    const [showExport, setShowExport] = useState(false);
    const [supabaseTransactions, setSupabaseTransactions] = useState<SupabaseTransaction[]>([]);
    const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
    const [isLoadingSupabase, setIsLoadingSupabase] = useState(false);
    const [supabaseUserId, setSupabaseUserId] = useState<string | null>(null);

    const { user } = useAuthStore();

    // Get Supabase user on mount
    useEffect(() => {
        const getSupabaseUser = async () => {
            const { data: { user: supaUser } } = await supabase.auth.getUser();
            if (supaUser) {
                setSupabaseUserId(supaUser.id);
                console.log('Supabase user:', supaUser.id);
            } else {
                // Fallback to zustand user if available
                if (user?.id) {
                    setSupabaseUserId(user.id);
                }
            }
        };
        getSupabaseUser();
    }, [user]);

    // Mocking categories for now as hook might be empty
    const categories = [
        { id: '1', name: 'Food' },
        { id: '2', name: 'Shopping' },
        { id: '3', name: 'Transport' },
        { id: '4', name: 'Entertainment' },
    ];

    // Using real hook, but handling empty state gracefully
    const { data, isLoading } = useTransactions({
        page,
        limit: 10,
        search: search || undefined,
        categoryId: categoryFilter || undefined
    });

    const deleteMutation = useDeleteTransaction();

    // Fetch transactions from Supabase on load + live polling
    useEffect(() => {
        const fetchSupabaseTransactions = async () => {
            if (!supabaseUserId) return;

            setIsLoadingSupabase(true);
            try {
                const transactions = await supabaseTransactionService.getAll(supabaseUserId);
                setSupabaseTransactions(transactions);
                console.log('Fetched from Supabase:', transactions.length, 'transactions');
            } catch (error) {
                console.error('Failed to fetch from Supabase:', error);
            } finally {
                setIsLoadingSupabase(false);
            }
        };

        fetchSupabaseTransactions();

        // Live polling every 15 seconds
        const pollInterval = setInterval(fetchSupabaseTransactions, 15000);
        return () => clearInterval(pollInterval);
    }, [supabaseUserId]);

    // Refresh transactions from Supabase
    const refreshTransactions = async () => {
        if (!supabaseUserId) return;

        setIsLoadingSupabase(true);
        try {
            const transactions = await supabaseTransactionService.getAll(supabaseUserId);
            setSupabaseTransactions(transactions);
            genZToast.success('Transactions refreshed! 🔄');
        } catch (error) {
            genZToast.error('Failed to refresh');
        } finally {
            setIsLoadingSupabase(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            // Try to delete from Supabase first
            const deleted = await supabaseTransactionService.delete(id);
            if (deleted) {
                setSupabaseTransactions(prev => prev.filter(t => t.id !== id));
            }
            // Also try the api mutation
            await deleteMutation.mutateAsync(id).catch(() => { });
        } catch (error) {
            throw error;
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
        } catch (error) {
            console.error('Update failed:', error);
            throw error;
        }
    };

    const handleImport = (transactions: ParsedTransaction[]) => {
        // Refresh from Supabase to get the newly imported transactions
        refreshTransactions();
        console.log('Imported transactions:', transactions);
    };

    // Combine backend data with Supabase transactions (avoiding duplicates)
    const apiTransactions = (data as any)?.transactions || (data as any)?.data || [];
    const apiIds = new Set(apiTransactions.map((t: any) => t.id));
    const uniqueSupabaseTransactions = supabaseTransactions.filter(t => !apiIds.has(t.id));

    const allTransactions = [
        ...uniqueSupabaseTransactions.map(t => ({
            id: t.id,
            date: t.date,
            description: t.description,
            amount: t.amount,
            type: t.type,
            category: t.category,
            source: t.source,
        })),
        ...apiTransactions,
    ];

    return (
        <div className={styles.container}>
            {/* Header */}
            <motion.div
                className={styles.pageHeader}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className={styles.titleSection}>
                    <h1>Transaction Log 📜</h1>
                    <p>Every penny counted. Currency: {getCurrencyCode()}</p>
                </div>
                <div className={styles.headerButtons}>
                    <motion.button
                        className={styles.refreshBtn}
                        onClick={refreshTransactions}
                        disabled={isLoadingSupabase}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        title="Refresh transactions"
                    >
                        <RefreshCw size={18} className={isLoadingSupabase ? styles.spinning : ''} />
                    </motion.button>
                    <motion.button
                        className={styles.pdfBtn}
                        onClick={() => setShowPDFAnalyzer(true)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <Brain size={18} /> AI PDF
                    </motion.button>
                    <motion.button
                        className={styles.importBtn}
                        onClick={() => setShowImport(true)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <FileUp size={18} /> CSV
                    </motion.button>
                    <motion.button
                        className={styles.addBtn}
                        onClick={() => setShowExport(true)}
                        whileHover={{ scale: 1.05, rotate: -2 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <Download size={20} /> Export
                    </motion.button>
                </div>
            </motion.div>

            {/* Controls */}
            <div className={styles.controlsBar}>
                <div className={styles.searchWrapper}>
                    <Search className={styles.searchIcon} size={20} />
                    <input
                        type="text"
                        placeholder="Search vibes..."
                        className={styles.searchInput}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <select
                    className={styles.filterSelect}
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                >
                    <option value="">All Vibes</option>
                    {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                </select>
            </div>

            {/* Supabase Transactions Notice */}
            {supabaseTransactions.length > 0 && (
                <motion.div
                    className={styles.importedNotice}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <Upload size={16} />
                    {supabaseTransactions.length} transactions saved to your account
                </motion.div>
            )}

            {/* Transactions List */}
            <div className={styles.transactionsList}>
                {isLoading ? (
                    <div style={{ textAlign: 'center', padding: '2rem', fontSize: '1.2rem', fontWeight: 600 }}>
                        Loading that data... ⏳
                    </div>
                ) : allTransactions.length > 0 ? (
                    <div className={styles.transactionSlats}>
                        <AnimatePresence>
                            {allTransactions.map((tx: any, index: number) => (
                                <motion.div
                                    key={tx.id}
                                    className={`${styles.transactionItem} ${tx.id?.toString().startsWith('import') ? styles.imported : ''}`}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ delay: index * 0.05 }}
                                >
                                    <div className={styles.iconWrapper}>
                                        <ShoppingBag size={20} />
                                    </div>

                                    <div className={styles.txInfo}>
                                        <h3>{tx.description || 'Unknown Purchase'}</h3>
                                        <span className={styles.txCategory}>
                                            {tx.category?.name || tx.category || 'Uncategorized'}
                                        </span>
                                    </div>

                                    <span className={styles.txDate}>
                                        {format(new Date(tx.date), 'MMM d, yyyy')}
                                    </span>

                                    <div className={`${styles.txAmount} ${tx.type === 'expense' ? styles.expense : styles.income}`}>
                                        {tx.type === 'expense' ? '-' : '+'}{formatCurrency(Math.abs(tx.amount))}
                                    </div>

                                    <div className={styles.actions}>
                                        <button
                                            className={styles.actionBtn}
                                            onClick={() => setSelectedTransaction(tx)}
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            className={`${styles.actionBtn} ${styles.deleteBtn}`}
                                            onClick={() => setSelectedTransaction(tx)}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                ) : (
                    <motion.div
                        className={styles.emptyState}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <h3>Nothing to show here folks! 🦗</h3>
                        <p>Import a CSV file or add transactions manually.</p>
                        <button className={styles.emptyImportBtn} onClick={() => setShowImport(true)}>
                            <FileUp size={18} /> Import Bank Statement
                        </button>
                    </motion.div>
                )}
            </div>

            {/* Pagination */}
            <div className={styles.pagination}>
                <button
                    className={styles.pageBtn}
                    disabled={page === 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                >
                    <ArrowLeft size={16} /> Prev
                </button>
                <span className={styles.pageInfo}>Page {page}</span>
                <button
                    className={styles.pageBtn}
                    disabled={!(data as any)?.hasMore}
                    onClick={() => setPage(p => p + 1)}
                >
                    Next <ArrowRight size={16} />
                </button>
            </div>

            {/* CSV Import Modal */}
            <AnimatePresence>
                {showImport && (
                    <CSVImport
                        onImport={handleImport}
                        onClose={() => setShowImport(false)}
                    />
                )}
            </AnimatePresence>

            {/* PDF Analyzer Modal */}
            <AnimatePresence>
                {showPDFAnalyzer && (
                    <PDFAnalyzer
                        onComplete={(transactions) => {
                            // Refresh transactions from Supabase after PDF import
                            console.log('PDF import complete:', transactions.length, 'transactions');
                            refreshTransactions();
                        }}
                        onClose={() => setShowPDFAnalyzer(false)}
                    />
                )}
            </AnimatePresence>

            {/* Transaction Edit/Delete Dialog */}
            <AnimatePresence>
                {selectedTransaction && (
                    <TransactionDialog
                        transaction={selectedTransaction}
                        onSave={handleUpdate}
                        onDelete={handleDelete}
                        onClose={() => setSelectedTransaction(null)}
                    />
                )}
            </AnimatePresence>

            {/* Export Modal */}
            <AnimatePresence>
                {showExport && (
                    <ExportModal
                        transactions={allTransactions}
                        onClose={() => setShowExport(false)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default TransactionsPage;
