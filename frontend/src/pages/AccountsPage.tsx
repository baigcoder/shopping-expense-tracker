import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, Wallet, TrendingUp, TrendingDown, DollarSign, X,
    RefreshCw, Trash2, Edit2, Building2, Landmark, CreditCard,
    PiggyBank, Briefcase, Banknote
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuthStore } from '../store/useStore';
import bankAccountService, { BankAccount } from '../services/bankAccountService';
import styles from './AccountsPage.module.css';

const ACCOUNT_TYPES = {
    checking: { label: 'Checking', icon: Building2, color: '#3B82F6' },
    savings: { label: 'Savings', icon: PiggyBank, color: '#10B981' },
    credit: { label: 'Credit Card', icon: CreditCard, color: '#EF4444' },
    investment: { label: 'Investment', icon: Briefcase, color: '#8B5CF6' },
    cash: { label: 'Cash', icon: Banknote, color: '#F59E0B' }
};

const BANK_COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899', '#14B8A6', '#6366F1'];

const AccountsPage = () => {
    const { user } = useAuthStore();
    const [accounts, setAccounts] = useState<BankAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        bank_name: '',
        account_type: 'checking' as keyof typeof ACCOUNT_TYPES,
        balance: '',
        currency: 'USD',
        color: BANK_COLORS[0]
    });

    // Fetch accounts
    const fetchAccounts = async () => {
        if (!user?.id) return;
        setLoading(true);
        const data = await bankAccountService.getAll(user.id);
        setAccounts(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchAccounts();
    }, [user?.id]);

    // Calculate totals
    const totals = bankAccountService.calculateNetWorth(accounts);

    // Handle refresh
    const handleRefresh = async () => {
        setIsRefreshing(true);
        await fetchAccounts();
        setIsRefreshing(false);
        toast.success('Refreshed!');
    };

    // Handle form submit
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.id) return;

        const data = {
            user_id: user.id,
            name: formData.name,
            bank_name: formData.bank_name,
            account_type: formData.account_type,
            balance: parseFloat(formData.balance) || 0,
            currency: formData.currency,
            color: formData.color,
            icon: ACCOUNT_TYPES[formData.account_type].icon.name,
            is_active: true,
            last_updated: new Date().toISOString()
        };

        if (editingAccount) {
            const success = await bankAccountService.update(editingAccount.id, data);
            if (success) toast.success('Account updated!');
        } else {
            const created = await bankAccountService.create(data);
            if (created) toast.success('Account added!');
        }

        closeModal();
        fetchAccounts();
    };

    // Handle delete
    const handleDelete = async (id: string) => {
        if (!confirm('Delete this account?')) return;
        const success = await bankAccountService.delete(id);
        if (success) {
            toast.success('Account deleted!');
            fetchAccounts();
        }
    };

    // Handle balance update
    const handleUpdateBalance = async (id: string) => {
        const newBalance = prompt('Enter new balance:');
        if (newBalance === null) return;

        const balance = parseFloat(newBalance);
        if (isNaN(balance)) {
            toast.error('Invalid balance');
            return;
        }

        const success = await bankAccountService.updateBalance(id, balance);
        if (success) {
            toast.success('Balance updated!');
            fetchAccounts();
        }
    };

    // Open edit modal
    const openEdit = (account: BankAccount) => {
        setEditingAccount(account);
        setFormData({
            name: account.name,
            bank_name: account.bank_name,
            account_type: account.account_type as keyof typeof ACCOUNT_TYPES,
            balance: account.balance.toString(),
            currency: account.currency,
            color: account.color
        });
        setShowModal(true);
    };

    // Close modal
    const closeModal = () => {
        setShowModal(false);
        setEditingAccount(null);
        setFormData({
            name: '',
            bank_name: '',
            account_type: 'checking',
            balance: '',
            currency: 'USD',
            color: BANK_COLORS[0]
        });
    };

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.titleSection}>
                    <h1>Bank Accounts</h1>
                    <p>Track your balances & net worth</p>
                </div>
                <div className={styles.headerActions}>
                    <button className={styles.refreshBtn} onClick={handleRefresh} disabled={isRefreshing}>
                        <RefreshCw size={18} className={isRefreshing ? styles.spinning : ''} />
                    </button>
                    <button className={styles.addBtn} onClick={() => setShowModal(true)}>
                        <Plus size={18} />
                        Add Account
                    </button>
                </div>
            </div>

            {/* Net Worth Summary */}
            <motion.div className={styles.netWorthCard} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <div className={styles.netWorthMain}>
                    <div className={styles.netWorthIconWrap}>
                        <Wallet size={28} />
                    </div>
                    <div>
                        <span className={styles.netWorthLabel}>Total Net Worth</span>
                        <span className={`${styles.netWorthValue} ${totals.netWorth < 0 ? styles.negative : ''}`}>
                            ${totals.netWorth.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                    </div>
                </div>
                <div className={styles.netWorthBreakdown}>
                    <div className={styles.breakdownItem}>
                        <div style={{ background: '#DCFCE7', padding: 8, borderRadius: 8 }}>
                            <TrendingUp size={16} className={styles.positive} />
                        </div>
                        <div>
                            <span>Assets</span>
                            <strong>${totals.assets.toLocaleString()}</strong>
                        </div>
                    </div>
                    <div className={styles.breakdownItem}>
                        <div style={{ background: '#FEE2E2', padding: 8, borderRadius: 8 }}>
                            <TrendingDown size={16} className={styles.negative} />
                        </div>
                        <div>
                            <span>Liabilities</span>
                            <strong>${totals.liabilities.toLocaleString()}</strong>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Accounts Grid */}
            <div className={styles.accountsGrid}>
                {loading ? (
                    <div className={styles.loading}>
                        <RefreshCw size={24} className={styles.spinning} />
                        <p style={{ marginTop: 10 }}>Loading accounts...</p>
                    </div>
                ) : accounts.length === 0 ? (
                    <div className={styles.empty}>
                        <Landmark size={48} />
                        <h3>No accounts found</h3>
                        <p>Add your first bank account to track finances</p>
                        <button className={styles.addBtn} onClick={() => setShowModal(true)} style={{ margin: '0 auto' }}>
                            <Plus size={18} /> Add Account
                        </button>
                    </div>
                ) : (
                    accounts.map((account, index) => {
                        const typeConfig = ACCOUNT_TYPES[account.account_type as keyof typeof ACCOUNT_TYPES];
                        const Icon = typeConfig?.icon || Building2;
                        const isNegative = account.balance < 0;

                        return (
                            <motion.div
                                key={account.id}
                                className={styles.accountCard}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <div className={styles.cardHeader}>
                                    <div className={styles.cardIcon} style={{ background: account.color + '15', color: account.color }}>
                                        <Icon size={24} />
                                    </div>
                                    <div className={styles.cardInfo}>
                                        <h3>{account.name}</h3>
                                        <p>{account.bank_name}</p>
                                    </div>
                                    <div className={styles.cardActions}>
                                        <button onClick={() => openEdit(account)}><Edit2 size={14} /></button>
                                        <button onClick={() => handleDelete(account.id)} className={styles.deleteBtn}><Trash2 size={14} /></button>
                                    </div>
                                </div>

                                <div className={styles.cardBalance} onClick={() => handleUpdateBalance(account.id)}>
                                    <span className={styles.balanceLabel}>Current Balance</span>
                                    <span className={`${styles.balanceValue} ${isNegative ? styles.negative : ''}`}>
                                        {account.currency === 'USD' ? '$' : account.currency} {Math.abs(account.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>

                                <div className={styles.cardFooter}>
                                    <span className={styles.accountType}>{typeConfig?.label || account.account_type}</span>
                                    <span className={styles.lastUpdated}>
                                        Updated {new Date(account.last_updated).toLocaleDateString()}
                                    </span>
                                </div>
                            </motion.div>
                        );
                    })
                )}
            </div>

            {/* Add/Edit Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div
                        className={styles.modalOverlay}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeModal}
                    >
                        <motion.div
                            className={styles.modal}
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className={styles.modalHeader}>
                                <h2>{editingAccount ? 'Edit Account' : 'Add Bank Account'}</h2>
                                <button onClick={closeModal}><X size={20} /></button>
                            </div>

                            <form onSubmit={handleSubmit} className={styles.form}>
                                <div className={styles.formGroup}>
                                    <label>Account Name</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g., Main Checking"
                                        required
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Bank Name</label>
                                    <input
                                        type="text"
                                        value={formData.bank_name}
                                        onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                                        placeholder="e.g., Chase, Bank of America"
                                        required
                                    />
                                </div>

                                <div className={styles.formRow}>
                                    <div className={styles.formGroup}>
                                        <label>Account Type</label>
                                        <select
                                            value={formData.account_type}
                                            onChange={(e) => setFormData({ ...formData, account_type: e.target.value as any })}
                                        >
                                            {Object.entries(ACCOUNT_TYPES).map(([key, val]) => (
                                                <option key={key} value={key}>{val.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Currency</label>
                                        <select
                                            value={formData.currency}
                                            onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                                        >
                                            <option value="USD">USD ($)</option>
                                            <option value="PKR">PKR (Rs)</option>
                                            <option value="EUR">EUR (€)</option>
                                            <option value="GBP">GBP (£)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Current Balance</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.balance}
                                        onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                                        placeholder="0.00"
                                        required
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Color</label>
                                    <div className={styles.colorPicker}>
                                        {BANK_COLORS.map((color) => (
                                            <button
                                                key={color}
                                                type="button"
                                                className={`${styles.colorOption} ${formData.color === color ? styles.selected : ''}`}
                                                style={{ background: color }}
                                                onClick={() => setFormData({ ...formData, color })}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <div className={styles.formActions}>
                                    <button type="button" className={styles.cancelBtn} onClick={closeModal}>
                                        Cancel
                                    </button>
                                    <button type="submit" className={styles.submitBtn}>
                                        {editingAccount ? 'Update' : 'Add Account'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AccountsPage;
