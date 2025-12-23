import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import {
    Search, Plus, Trash2, Edit2, ArrowRight, ArrowLeft,
    Upload, Download, FileUp, Brain, RefreshCw, Filter,
    TrendingUp, TrendingDown, MoreHorizontal, FileText, Receipt
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTransactions, useDeleteTransaction } from '../hooks/useTransactions';
import { useAuthStore } from '../store/useStore';
import { formatCurrency } from '../services/currencyService';
import { supabaseTransactionService, SupabaseTransaction } from '../services/supabaseTransactionService';
import { supabase } from '../config/supabase';
import { useTransactionRealtime } from '../hooks/useRealtimeSync';
import { ParsedTransaction } from '../services/csvImportService';
import { toast } from 'sonner';
import LoadingScreen from '../components/LoadingScreen';
import TransactionDialog from '../components/TransactionDialog';
import CSVImport from '../components/CSVImport';
import ExportModal from '../components/ExportModal';
import PDFAnalyzer from '../components/PDFAnalyzer';
import { cn } from '@/lib/utils';
import { useSound } from '@/hooks/useSound';

const TransactionsPage = () => {
    const { user } = useAuthStore();
    const sound = useSound();

    // State
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [supabaseTransactions, setSupabaseTransactions] = useState<SupabaseTransaction[]>([]);
    const [isLoadingSupabase, setIsLoadingSupabase] = useState(false);
    const [supabaseUserId, setSupabaseUserId] = useState<string | null>(null);

    // Modals
    const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
    const [showImport, setShowImport] = useState(false);
    const [showPDFAnalyzer, setShowPDFAnalyzer] = useState(false);
    const [showExport, setShowExport] = useState(false);

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
    const fetchSupabaseTransactions = async () => {
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
    };

    useEffect(() => {
        fetchSupabaseTransactions();
        const pollInterval = setInterval(fetchSupabaseTransactions, 15000);
        return () => clearInterval(pollInterval);
    }, [supabaseUserId]);

    // Realtime Sync
    const refreshTransactions = async () => {
        await fetchSupabaseTransactions();
        toast.success('Ledger Refreshed', { description: 'Latest transaction data synchronized.' });
        sound.playSuccess();
    };

    useTransactionRealtime({
        onInsert: () => fetchSupabaseTransactions(),
        onUpdate: () => fetchSupabaseTransactions(),
        onDelete: () => fetchSupabaseTransactions()
    });

    // CRUD Operations
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
            toast.error('Operation Failed', { description: 'Could not remove the selected record.' });
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
            toast.error('Modification failed', { description: 'The changes could not be committed to the vault.' });
        }
    };

    // Combine Data
    const apiTransactions = (data as any)?.transactions || [];
    const apiIds = new Set(apiTransactions.map((t: any) => t.id));
    const uniqueSupabaseTransactions = supabaseTransactions.filter(t => !apiIds.has(t.id));

    // Filter locally for seamless UX
    const allTransactions = [...uniqueSupabaseTransactions, ...apiTransactions]
        .filter(t => categoryFilter === 'all' || (t.category?.name === categoryFilter || t.category === categoryFilter))
        .filter(t => !search || t.description.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Stats
    const totalIncome = allTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = allTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + Math.abs(t.amount), 0);

    if (isLoading || (isLoadingSupabase && supabaseTransactions.length === 0)) {
        return <LoadingScreen />;
    }

    return (
        <div className="p-4 md:p-8 lg:p-12 max-w-7xl mx-auto space-y-10 bg-[#FAFBFF] min-h-screen">
            {/* Header Redesign */}
            <motion.div
                className="flex flex-col md:flex-row md:items-end justify-between gap-6"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="p-4 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 shadow-xl shadow-blue-100 ring-4 ring-blue-50">
                            <Receipt className="h-7 w-7 text-white" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h1 className="text-4xl font-black text-slate-800 tracking-tighter font-display">Treasury Log</h1>
                                <Badge className="bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100 transition-colors px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Real-time Sync</Badge>
                            </div>
                            <p className="text-slate-500 font-bold text-lg flex items-center gap-2">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                                </span>
                                Monitoring your financial ecosystem
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap gap-3">
                    <Button
                        variant="outline"
                        onClick={refreshTransactions}
                        className="h-12 px-6 rounded-2xl border-2 border-slate-100 bg-white hover:bg-slate-50 font-black text-xs uppercase tracking-widest text-slate-600 shadow-sm"
                    >
                        <RefreshCw className={cn("mr-2 h-4 w-4", isLoadingSupabase && "animate-spin")} />
                        Refresh
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => setShowPDFAnalyzer(true)}
                        className="h-12 px-6 rounded-2xl border-2 border-slate-100 bg-white hover:bg-slate-50 font-black text-xs uppercase tracking-widest text-slate-600 shadow-sm"
                    >
                        <Brain className="mr-2 h-4 w-4 text-indigo-500" />
                        AI PDF
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => setShowImport(true)}
                        className="h-12 px-6 rounded-2xl border-2 border-slate-100 bg-white hover:bg-slate-50 font-black text-xs uppercase tracking-widest text-slate-600 shadow-sm"
                    >
                        <FileUp className="mr-2 h-4 w-4 text-blue-500" />
                        Import
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => setShowExport(true)}
                        className="h-12 px-6 rounded-2xl border-2 border-slate-100 bg-white hover:bg-slate-50 font-black text-xs uppercase tracking-widest text-slate-600 shadow-sm"
                    >
                        <Download className="mr-2 h-4 w-4 text-slate-500" />
                        Export
                    </Button>
                </div>
            </motion.div>

            {/* Stats Summary Redesign */}
            <motion.div
                className="grid grid-cols-1 md:grid-cols-3 gap-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                {/* Total Income Card */}
                <motion.div
                    whileHover={{ y: -5 }}
                    className="group relative overflow-hidden bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-100/50 border-2 border-slate-50"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-blue-100 transition-colors" />
                    <div className="relative flex items-center justify-between mb-6">
                        <div className="p-4 rounded-2xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                            <TrendingUp className="h-6 w-6" />
                        </div>
                        <Badge className="bg-blue-50 text-blue-600 border-none px-3 font-black">+{allTransactions.filter(t => t.type === 'income').length}</Badge>
                    </div>
                    <div className="relative">
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Accumulated Inflow</p>
                        <h3 className="text-3xl font-black text-slate-800 tracking-tighter">{formatCurrency(totalIncome)}</h3>
                        <div className="mt-4 h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: '65%' }}
                                className="h-full bg-blue-500 rounded-full"
                            />
                        </div>
                    </div>
                </motion.div>

                {/* Total Expenses Card */}
                <motion.div
                    whileHover={{ y: -5 }}
                    className="group relative overflow-hidden bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-100/50 border-2 border-slate-50"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-slate-100 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-slate-200 transition-colors" />
                    <div className="relative flex items-center justify-between mb-6">
                        <div className="p-4 rounded-2xl bg-slate-100 text-slate-600 group-hover:bg-slate-800 group-hover:text-white transition-all duration-300">
                            <TrendingDown className="h-6 w-6" />
                        </div>
                        <Badge className="bg-slate-100 text-slate-600 border-none px-3 font-black">-{allTransactions.filter(t => t.type === 'expense').length}</Badge>
                    </div>
                    <div className="relative">
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Consumption</p>
                        <h3 className="text-3xl font-black text-slate-800 tracking-tighter">-{formatCurrency(totalExpense)}</h3>
                        <div className="mt-4 h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: '45%' }}
                                className="h-full bg-slate-800 rounded-full"
                            />
                        </div>
                    </div>
                </motion.div>

                {/* Net Balance Card */}
                <motion.div
                    whileHover={{ y: -5 }}
                    className="group relative overflow-hidden bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-100/50 border-2 border-slate-50"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-indigo-100 transition-colors" />
                    <div className="relative flex items-center justify-between mb-6">
                        <div className="p-4 rounded-2xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                            <FileText className="h-6 w-6" />
                        </div>
                        <Badge className={cn("border-none px-3 font-black", totalIncome - totalExpense >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600")}>
                            {totalIncome - totalExpense >= 0 ? 'Surplus' : 'Deficit'}
                        </Badge>
                    </div>
                    <div className="relative">
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Treasury Balance</p>
                        <h3 className={cn(
                            "text-3xl font-black tracking-tighter",
                            totalIncome - totalExpense >= 0 ? "text-blue-600" : "text-amber-600"
                        )}>
                            {formatCurrency(totalIncome - totalExpense)}
                        </h3>
                        <div className="mt-4 h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: '82%' }}
                                className="h-full bg-indigo-500 rounded-full"
                            />
                        </div>
                    </div>
                </motion.div>
            </motion.div>

            {/* Filters Redesign */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex flex-col md:flex-row gap-4 p-4 bg-white border-2 border-slate-50 rounded-[2rem] shadow-xl shadow-slate-100/50"
            >
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                    <Input
                        placeholder="Search by description or merchant..."
                        className="h-14 pl-12 pr-4 rounded-2xl border-2 border-slate-50 bg-slate-50/50 focus:bg-white focus:border-blue-100 focus:ring-4 focus:ring-blue-50 transition-all font-bold text-slate-700 placeholder:text-slate-400 placeholder:font-bold"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="w-full md:w-[240px]">
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger className="h-14 rounded-2xl border-2 border-slate-50 bg-slate-50/50 focus:bg-white focus:border-blue-100 focus:ring-4 focus:ring-blue-50 transition-all font-black text-slate-700">
                            <div className="flex items-center gap-2">
                                <Filter className="h-4 w-4 text-slate-400" />
                                <SelectValue placeholder="All Categories" />
                            </div>
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-2 border-slate-50 shadow-2xl p-2">
                            <SelectItem value="all" className="rounded-xl font-black text-slate-600 focus:bg-blue-50 focus:text-blue-700">All Categories</SelectItem>
                            {['Food', 'Shopping', 'Transport', 'Entertainment', 'Utilities', 'Health'].map(cat => (
                                <SelectItem key={cat} value={cat} className="rounded-xl font-black text-slate-600 focus:bg-blue-50 focus:text-blue-700">
                                    {cat}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </motion.div>

            {/* Transactions Table Redesign */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white border-2 border-slate-50 rounded-[2.5rem] shadow-xl shadow-slate-100/50 overflow-hidden"
            >
                <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-black text-slate-800 tracking-tight">Activity History</h3>
                        <p className="text-slate-400 text-xs font-black uppercase tracking-widest mt-1">Detailed Ledger</p>
                    </div>
                    <Badge variant="outline" className="border-slate-200 text-slate-400 font-black uppercase tracking-widest px-4 py-1.5 rounded-2xl">
                        {allTransactions.length} Total
                    </Badge>
                </div>

                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent border-none">
                                <TableHead className="py-6 px-8 text-[11px] font-black uppercase tracking-widest text-slate-400">Description</TableHead>
                                <TableHead className="py-6 px-8 text-[11px] font-black uppercase tracking-widest text-slate-400">Classification</TableHead>
                                <TableHead className="py-6 px-8 text-[11px] font-black uppercase tracking-widest text-slate-400">Timestamp</TableHead>
                                <TableHead className="py-6 px-8 text-[11px] font-black uppercase tracking-widest text-slate-400 text-right">Magnitude</TableHead>
                                <TableHead className="w-[80px] pr-8"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {allTransactions.length > 0 ? (
                                allTransactions.slice((page - 1) * 10, page * 10).map((transaction: any) => (
                                    <TableRow key={transaction.id} className="group hover:bg-slate-50/50 transition-colors border-slate-50/50">
                                        <TableCell className="py-6 px-8">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-slate-800">{transaction.description}</span>
                                                {transaction.source && (
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-0.5">{transaction.source}</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-6 px-8">
                                            <Badge className="bg-slate-100 text-slate-600 border-none font-black text-[10px] uppercase tracking-tighter hover:bg-blue-600 hover:text-white transition-colors">
                                                {transaction.category?.name || transaction.category || 'Other'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="py-6 px-8">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-slate-600">{format(new Date(transaction.date), 'MMM dd, yyyy')}</span>
                                                <span className="text-[10px] font-medium text-slate-400">{format(new Date(transaction.date), 'HH:mm')}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className={cn(
                                            "py-6 px-8 text-right font-black tracking-tighter text-lg",
                                            transaction.type === 'expense' ? "text-slate-800" : "text-blue-600"
                                        )}>
                                            {transaction.type === 'expense' ? '-' : '+'}{formatCurrency(Math.abs(transaction.amount))}
                                        </TableCell>

                                        <TableCell className="py-6 pr-8">
                                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-10 w-10 rounded-xl hover:bg-white hover:shadow-lg transition-all text-slate-400 hover:text-blue-600"
                                                    onClick={() => setSelectedTransaction(transaction)}
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-10 w-10 rounded-xl hover:bg-white hover:shadow-lg transition-all text-slate-400 hover:text-red-600"
                                                    onClick={() => handleDelete(transaction.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="py-20 text-center">
                                        <div className="flex flex-col items-center justify-center opacity-20">
                                            <Receipt className="h-16 w-16 mb-4" />
                                            <p className="font-black text-lg uppercase tracking-widest">No transactions logged</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                {allTransactions.length > 10 && (
                    <div className="flex items-center justify-between px-8 py-6 bg-slate-50/30 border-t border-slate-50">
                        <div className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
                            Page {page} of {Math.ceil(allTransactions.length / 10)}
                        </div>
                        <div className="flex items-center space-x-3">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="h-10 px-4 rounded-xl border-2 border-slate-100 bg-white hover:bg-slate-50 disabled:opacity-30 font-black text-[10px] uppercase tracking-widest"
                            >
                                <ArrowLeft className="h-3.5 w-3.5 mr-2" />
                                Prev
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => p + 1)}
                                disabled={page >= Math.ceil(allTransactions.length / 10)}
                                className="h-10 px-4 rounded-xl border-2 border-slate-100 bg-white hover:bg-slate-50 disabled:opacity-30 font-black text-[10px] uppercase tracking-widest"
                            >
                                Next
                                <ArrowRight className="h-3.5 w-3.5 ml-2" />
                            </Button>
                        </div>
                    </div>
                )}
            </motion.div>

            {/* Modals */}
            <AnimatePresence>
                {showImport && <CSVImport onImport={refreshTransactions} onClose={() => setShowImport(false)} />}
                {showPDFAnalyzer && <PDFAnalyzer onComplete={refreshTransactions} onClose={() => setShowPDFAnalyzer(false)} />}
                {showExport && <ExportModal onClose={() => setShowExport(false)} transactions={allTransactions} />}
                {selectedTransaction && (
                    <TransactionDialog
                        transaction={selectedTransaction}
                        onSave={handleUpdate}
                        onDelete={handleDelete}
                        onClose={() => setSelectedTransaction(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default TransactionsPage;
