import { beforeEach, describe, expect, it, vi } from 'vitest';

const service = vi.hoisted(() => ({ getAll: vi.fn(), update: vi.fn(), delete: vi.fn() }));
vi.mock('../../services/cardService', () => ({ cardService: service }));
vi.mock('../../config/supabase', () => ({ supabase: { auth: { signOut: vi.fn() } } }));

const removed = vi.spyOn(localStorage, 'removeItem');
const { useCardStore } = await import('../useStore');

const row = { id: 'c1', user_id: 'u', last4: '4021', holder: 'A', expiry: '08/28', card_type: 'visa', theme: 't', created_at: '', is_frozen: true, is_default: true, nickname: 'Everyday', spending_limit: 60000 };

describe('card store', () => {
    beforeEach(() => { Object.values(service).forEach((f) => f.mockReset()); useCardStore.setState({ cards: [], currentUserId: null }); });

    it('drops the old shared browser copy of every user’s cards', () => {
        expect(removed).toHaveBeenCalledWith('all-cards-storage');
    });

    it('keeps freeze, primary, nickname and limit from the database', async () => {
        service.getAll.mockResolvedValue([row]);
        expect(await useCardStore.getState().initializeCards('u')).toBe(true);
        expect(useCardStore.getState().cards[0]).toMatchObject({ nickname: 'Everyday', is_frozen: true, is_default: true, spending_limit: 60000 });
    });

    it('reports a failed load instead of showing no cards or stale ones', async () => {
        service.getAll.mockRejectedValue(new Error('offline'));
        expect(await useCardStore.getState().initializeCards('u')).toBe(false);
    });

    it('puts a card back when freezing or removing it fails', async () => {
        service.getAll.mockResolvedValue([{ ...row, is_frozen: false }]);
        await useCardStore.getState().initializeCards('u');
        service.update.mockResolvedValue(null);
        await expect(useCardStore.getState().updateCard('c1', { is_frozen: true })).rejects.toThrow();
        expect(useCardStore.getState().cards[0].is_frozen).toBe(false);
        service.delete.mockResolvedValue(false);
        await expect(useCardStore.getState().removeCard('c1')).rejects.toThrow();
        expect(useCardStore.getState().cards).toHaveLength(1);
    });
});
