// Category Controller - Manage expense categories via CategoryDomainService
import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { CreateCategoryInput } from '../validators/schemas.js';
import {
    createUserCategory,
    deleteUserCategory,
    listUserCategories,
    updateUserCategory,
} from '../services/categoryDomainService.js';

const getCanonicalUserId = (req: Request): string => req.user?.supabaseId || req.user?.id || '';

// Get all categories (System + User Custom)
export const getCategories = asyncHandler(async (req: Request, res: Response) => {
    const userId = getCanonicalUserId(req);
    const categories = await listUserCategories(userId);

    res.json({
        success: true,
        data: categories,
    });
});

// Create user custom category
export const createCategory = asyncHandler(async (req: Request, res: Response) => {
    const userId = getCanonicalUserId(req);
    const { name, icon, color } = req.body as CreateCategoryInput;

    const category = await createUserCategory(userId, { name, icon, color });

    res.status(201).json({
        success: true,
        message: 'Category created successfully',
        data: category,
    });
});

// Update user custom category
export const updateCategory = asyncHandler(async (req: Request, res: Response) => {
    const userId = getCanonicalUserId(req);
    const { id } = req.params;
    const { name, icon, color } = req.body;

    const category = await updateUserCategory(userId, id, { name, icon, color });

    res.json({
        success: true,
        message: 'Category updated successfully',
        data: category,
    });
});

// Delete user custom category
export const deleteCategory = asyncHandler(async (req: Request, res: Response) => {
    const userId = getCanonicalUserId(req);
    const { id } = req.params;

    await deleteUserCategory(userId, id);

    res.json({
        success: true,
        message: 'Category deleted successfully',
    });
});
