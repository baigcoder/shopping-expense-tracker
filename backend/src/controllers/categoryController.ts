// Category Controller - Manage expense categories
import { Request, Response } from 'express';
import prisma from '../config/prisma.js';
import { asyncHandler, createError } from '../middleware/errorHandler.js';
import { CreateCategoryInput } from '../validators/schemas.js';

// Get all categories
export const getCategories = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;

    const categories = await prisma.category.findMany({
        where: { userId },
        include: {
            _count: {
                select: { transactions: true }
            }
        },
        orderBy: { name: 'asc' }
    });

    res.json({
        success: true,
        data: categories
    });
});

// Create category
export const createCategory = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { name, icon, color } = req.body as CreateCategoryInput;

    const category = await prisma.category.create({
        data: {
            userId,
            name,
            icon: icon || '🏷️',
            color: color || '#6366f1'
        }
    });

    res.status(201).json({
        success: true,
        message: 'Category created successfully',
        data: category
    });
});

// Update category
export const updateCategory = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { id } = req.params;
    const { name, icon, color } = req.body;

    const existing = await prisma.category.findFirst({
        where: { id, userId }
    });

    if (!existing) {
        throw createError('Category not found', 404);
    }

    const category = await prisma.category.update({
        where: { id },
        data: {
            ...(name && { name }),
            ...(icon && { icon }),
            ...(color && { color })
        }
    });

    res.json({
        success: true,
        message: 'Category updated successfully',
        data: category
    });
});

// Delete category
export const deleteCategory = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { id } = req.params;

    const existing = await prisma.category.findFirst({
        where: { id, userId }
    });

    if (!existing) {
        throw createError('Category not found', 404);
    }

    // Set transactions with this category to null
    await prisma.transaction.updateMany({
        where: { categoryId: id },
        data: { categoryId: null }
    });

    await prisma.category.delete({
        where: { id }
    });

    res.json({
        success: true,
        message: 'Category deleted successfully'
    });
});
