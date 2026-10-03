import { supabase } from '../config/supabase.js';
import { createError } from '../middleware/errorHandler.js';

export interface ExpenseCategory {
    id: string;
    userId: string | null;
    name: string;
    icon: string;
    color: string;
    isSystem: boolean;
    _count?: { transactions: number };
}

export const CANONICAL_SYSTEM_CATEGORIES: ExpenseCategory[] = [
    { id: 'cat_shopping', userId: null, name: 'Shopping', icon: '🛍️', color: '#ec4899', isSystem: true, _count: { transactions: 0 } },
    { id: 'cat_groceries', userId: null, name: 'Groceries', icon: '🛒', color: '#10b981', isSystem: true, _count: { transactions: 0 } },
    { id: 'cat_dining', userId: null, name: 'Dining', icon: '🍽️', color: '#f59e0b', isSystem: true, _count: { transactions: 0 } },
    { id: 'cat_transport', userId: null, name: 'Transport', icon: '🚗', color: '#3b82f6', isSystem: true, _count: { transactions: 0 } },
    { id: 'cat_utilities', userId: null, name: 'Utilities', icon: '⚡', color: '#06b6d4', isSystem: true, _count: { transactions: 0 } },
    { id: 'cat_entertainment', userId: null, name: 'Entertainment', icon: '🎬', color: '#8b5cf6', isSystem: true, _count: { transactions: 0 } },
    { id: 'cat_subscriptions', userId: null, name: 'Subscriptions', icon: '🔁', color: '#6366f1', isSystem: true, _count: { transactions: 0 } },
    { id: 'cat_health', userId: null, name: 'Health', icon: '💊', color: '#14b8a6', isSystem: true, _count: { transactions: 0 } },
    { id: 'cat_travel', userId: null, name: 'Travel', icon: '✈️', color: '#0ea5e9', isSystem: true, _count: { transactions: 0 } },
    { id: 'cat_electronics', userId: null, name: 'Electronics', icon: '💻', color: '#6366f1', isSystem: true, _count: { transactions: 0 } },
    { id: 'cat_other', userId: null, name: 'Other', icon: '📦', color: '#6b7280', isSystem: true, _count: { transactions: 0 } },
];

/**
 * Fetch all categories for a user: Canonical System Categories + User Custom Categories.
 */
export async function listUserCategories(userId: string): Promise<ExpenseCategory[]> {
    if (!userId) {
        throw createError('Unauthorized: Missing user identifier', 401, 'UNAUTHORIZED');
    }

    try {
        const { data: settingsData, error } = await supabase
            .from('user_settings')
            .select('custom_categories')
            .eq('user_id', userId)
            .maybeSingle();

        if (error) {
            console.warn(`[categoryDomainService] Failed to load custom categories: ${error.message}`);
        }

        const customCategories: ExpenseCategory[] = Array.isArray(settingsData?.custom_categories)
            ? settingsData.custom_categories
            : [];

        // Combine system categories and user categories
        return [...CANONICAL_SYSTEM_CATEGORIES, ...customCategories];
    } catch (err: any) {
        console.warn(`[categoryDomainService] Fallback to system categories: ${err.message}`);
        return [...CANONICAL_SYSTEM_CATEGORIES];
    }
}

/**
 * Create a custom category for a user.
 */
export async function createUserCategory(
    userId: string,
    input: { name: string; icon?: string; color?: string }
): Promise<ExpenseCategory> {
    if (!userId) {
        throw createError('Unauthorized', 401, 'UNAUTHORIZED');
    }
    if (!input.name || !input.name.trim()) {
        throw createError('Category name is required', 400, 'VALIDATION_ERROR');
    }

    const trimmedName = input.name.trim();

    // Check for duplicate name against system categories
    if (CANONICAL_SYSTEM_CATEGORIES.some((c) => c.name.toLowerCase() === trimmedName.toLowerCase())) {
        throw createError(`Category '${trimmedName}' is a standard system category`, 409, 'CONFLICT');
    }

    const { data: settingsData, error: fetchErr } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

    if (fetchErr) {
        throw createError(`Failed to access user settings: ${fetchErr.message}`, 503, 'DATABASE_ERROR');
    }

    const customCategories: ExpenseCategory[] = Array.isArray(settingsData?.custom_categories)
        ? settingsData.custom_categories
        : [];

    if (customCategories.some((c) => c.name.toLowerCase() === trimmedName.toLowerCase())) {
        throw createError(`Custom category '${trimmedName}' already exists`, 409, 'CONFLICT');
    }

    const newCategory: ExpenseCategory = {
        id: `user_cat_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        userId,
        name: trimmedName,
        icon: input.icon || '🏷️',
        color: input.color || '#6366f1',
        isSystem: false,
        _count: { transactions: 0 },
    };

    const nextCustom = [...customCategories, newCategory];

    const { error: upsertErr } = await supabase
        .from('user_settings')
        .upsert(
            {
                user_id: userId,
                custom_categories: nextCustom,
                updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id' }
        );

    if (upsertErr) {
        throw createError(`Failed to save category: ${upsertErr.message}`, 503, 'DATABASE_ERROR');
    }

    return newCategory;
}

/**
 * Update a user-defined category.
 */
export async function updateUserCategory(
    userId: string,
    id: string,
    updates: { name?: string; icon?: string; color?: string }
): Promise<ExpenseCategory> {
    if (CANONICAL_SYSTEM_CATEGORIES.some((c) => c.id === id)) {
        throw createError('System categories cannot be modified', 403, 'FORBIDDEN');
    }

    const { data: settingsData, error: fetchErr } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

    if (fetchErr) {
        throw createError(`Failed to access user settings: ${fetchErr.message}`, 503, 'DATABASE_ERROR');
    }

    const customCategories: ExpenseCategory[] = Array.isArray(settingsData?.custom_categories)
        ? settingsData.custom_categories
        : [];

    const index = customCategories.findIndex((c) => c.id === id && c.userId === userId);
    if (index === -1) {
        throw createError('Category not found', 404, 'NOT_FOUND');
    }

    const current = customCategories[index];
    const updated: ExpenseCategory = {
        ...current,
        name: updates.name ? updates.name.trim() : current.name,
        icon: updates.icon || current.icon,
        color: updates.color || current.color,
    };

    customCategories[index] = updated;

    const { error: saveErr } = await supabase
        .from('user_settings')
        .upsert(
            {
                user_id: userId,
                custom_categories: customCategories,
                updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id' }
        );

    if (saveErr) {
        throw createError(`Failed to update category: ${saveErr.message}`, 503, 'DATABASE_ERROR');
    }

    return updated;
}

/**
 * Delete a user-defined category.
 */
export async function deleteUserCategory(userId: string, id: string): Promise<void> {
    if (CANONICAL_SYSTEM_CATEGORIES.some((c) => c.id === id)) {
        throw createError('System categories cannot be deleted', 403, 'FORBIDDEN');
    }

    const { data: settingsData, error: fetchErr } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

    if (fetchErr) {
        throw createError(`Failed to access user settings: ${fetchErr.message}`, 503, 'DATABASE_ERROR');
    }

    const customCategories: ExpenseCategory[] = Array.isArray(settingsData?.custom_categories)
        ? settingsData.custom_categories
        : [];

    const filtered = customCategories.filter((c) => !(c.id === id && c.userId === userId));
    if (filtered.length === customCategories.length) {
        throw createError('Category not found', 404, 'NOT_FOUND');
    }

    const { error: saveErr } = await supabase
        .from('user_settings')
        .upsert(
            {
                user_id: userId,
                custom_categories: filtered,
                updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id' }
        );

    if (saveErr) {
        throw createError(`Failed to delete category: ${saveErr.message}`, 503, 'DATABASE_ERROR');
    }
}
