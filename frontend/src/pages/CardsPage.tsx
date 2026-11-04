// Cards and accounts: live cards (store) and bank accounts around the shared CardsView (the demo renders the same view).
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { CardsView, type AccountDraft } from '../features/cards/CardsView';
import { useCardStore, useModalStore, useAuthStore } from '../store/useStore';
import bankAccountService, { type BankAccount } from '../services/bankAccountService';
import { formatCurrency, getUserCurrency } from '../services/currencyService';

export const CardsPage = () => {
    const { user } = useAuthStore();
    const { cards, initializeCards, removeCard, updateCard, isLoading: cardsLoading } = useCardStore();
    const { openAddCard } = useModalStore();
    const [accounts, setAccounts] = useState<BankAccount[]>([]);
    const [loading, setLoading] = useState(true);

    const loadAccounts = useCallback(async () => {
        if (!user?.id) return;
        try { setAccounts(await bankAccountService.getAll(user.id)); }
        catch { toast.error('Could not load your accounts.'); }
        finally { setLoading(false); }
    }, [user?.id]);

    useEffect(() => {
        if (!user?.id) return;
        void initializeCards(user.id).then((ok) => { if (!ok) toast.error('Could not load your cards.'); });
        void loadAccounts();
    }, [user?.id, initializeCards, loadAccounts]);

    const save = async (work: () => Promise<void>, ok: string) => {
        try { await work(); toast.success(ok); }
        catch { toast.error('That did not save. Try again.'); }
    };

    const saveAccount = async (d: AccountDraft, id?: string) => {
        if (!user?.id) return;
        const data = {
            user_id: user.id, name: d.name, bank_name: d.bank || 'Bank', account_type: d.type, balance: d.balance,
            currency: getUserCurrency().code, color: 'var(--color-brand)', icon: d.type, is_active: true, last_updated: new Date().toISOString(),
        };
        // The service reports failure by returning false or null; keep the form open when it does.
        const ok = id ? await bankAccountService.update(id, data) : await bankAccountService.create(data);
        if (!ok) { toast.error('That did not save. Try again.'); throw new Error('save failed'); }
        toast.success(id ? 'Account saved' : 'Account added');
        await loadAccounts();
    };

    return (
        <CardsView
            accounts={accounts.filter((a) => a.is_active).map((a) => ({ id: a.id, name: a.name, bank: a.bank_name, type: a.account_type, balance: a.balance }))}
            cards={cards.map((c) => ({ id: c.id, name: c.nickname || `${c.type === 'unknown' ? 'Card' : c.type} card`, brand: c.type, last4: c.last4, expiry: c.expiry, limit: c.spending_limit, frozen: c.is_frozen, primary: c.is_default }))}
            money={(n) => formatCurrency(n)}
            loading={loading || cardsLoading}
            onSaveAccount={saveAccount}
            onRemoveAccount={async (id) => {
                if (await bankAccountService.delete(id)) { toast.success('Account removed'); await loadAccounts(); }
                else toast.error('Could not remove it.');
            }}
            onAddCard={openAddCard}
            onFreeze={(id, frozen) => void save(() => updateCard(id, { is_frozen: frozen }), frozen ? 'Card frozen' : 'Card unfrozen')}
            // The old primary is cleared first: the database allows one primary card per user.
            onPrimary={(id) => void save(async () => {
                for (const c of cards) if (c.is_default && c.id !== id) await updateCard(c.id, { is_default: false });
                await updateCard(id, { is_default: true });
            }, 'Primary card changed')}
            onLimit={(id, limit) => void save(() => updateCard(id, { spending_limit: limit }), 'Limit saved')}
            onRename={(id, name) => void save(() => updateCard(id, { nickname: name }), 'Card renamed')}
            onRemoveCard={(id) => void save(() => removeCard(id), 'Card removed')}
        />
    );
};

export default CardsPage;
