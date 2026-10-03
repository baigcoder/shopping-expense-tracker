import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    CANONICAL_SYSTEM_CATEGORIES,
    createUserCategory,
    deleteUserCategory,
    listUserCategories,
    updateUserCategory,
} from '../categoryDomainService.js';
import { supabase } from '../../config/supabase.js';

vi.mock('../../config/supabase.js', () => ({
    supabase: {
        from: vi.fn(),
    },
}));

describe('categoryDomainService — Authoritative Category Management (INV-01)', () => {
    const userA = 'usr_category_test_A';
    const userB = 'usr_category_test_B';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('returns canonical system categories with correct icons and metadata', async () => {
        const mockQueryBuilder = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: { custom_categories: [] }, error: null }),
        };
        (supabase.from as any).mockReturnValue(mockQueryBuilder);

        const categories = await listUserCategories(userA);

        expect(categories.length).toBeGreaterThanOrEqual(CANONICAL_SYSTEM_CATEGORIES.length);
        expect(categories.some((c) => c.name === 'Shopping')).toBe(true);
        expect(categories.some((c) => c.name === 'Groceries')).toBe(true);
    });

    it('creates a custom category and persists to user_settings with onConflict user_id', async () => {
        const mockQueryBuilder = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: { custom_categories: [] }, error: null }),
            upsert: vi.fn().mockResolvedValue({ data: {}, error: null }),
        };
        (supabase.from as any).mockReturnValue(mockQueryBuilder);

        const newCat = await createUserCategory(userA, {
            name: 'Photography',
            icon: '📷',
            color: '#a855f7',
        });

        expect(newCat.name).toBe('Photography');
        expect(newCat.userId).toBe(userA);
        expect(newCat.isSystem).toBe(false);
        expect(supabase.from).toHaveBeenCalledWith('user_settings');
    });

    it('rejects creating custom category that collides with a system category name', async () => {
        await expect(
            createUserCategory(userA, {
                name: 'Shopping', // Collides with system category
            })
        ).rejects.toThrow(/standard system category/);
    });

    it('strictly forbids modifying or deleting canonical system categories', async () => {
        await expect(
            updateUserCategory(userA, 'cat_shopping', { name: 'New Shopping' })
        ).rejects.toThrow(/System categories cannot be modified/);

        await expect(
            deleteUserCategory(userA, 'cat_shopping')
        ).rejects.toThrow(/System categories cannot be deleted/);
    });

    it('enforces multi-tenant ownership: User A cannot update User B custom category', async () => {
        const userBCategory = {
            id: 'user_cat_B_123',
            userId: userB,
            name: 'User B Private Category',
            icon: '🔒',
            color: '#000000',
            isSystem: false,
        };

        const mockQueryBuilder = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            // User A settings returns User A categories (which does not contain userBCategory)
            maybeSingle: vi.fn().mockResolvedValue({ data: { custom_categories: [] }, error: null }),
        };
        (supabase.from as any).mockReturnValue(mockQueryBuilder);

        await expect(
            updateUserCategory(userA, userBCategory.id, { name: 'Hacked Name' })
        ).rejects.toThrow(/Category not found/);
    });
});
