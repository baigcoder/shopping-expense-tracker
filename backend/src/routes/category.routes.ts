// Category Routes
import { Router } from 'express';
import {
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory
} from '../controllers/categoryController.js';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createCategorySchema } from '../validators/schemas.js';
import { cacheControl } from '../middleware/cache.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// GET categories - cached for 1 hour (rarely changes)
router.get('/', cacheControl('static'), getCategories);

// Mutations - no cache
router.post('/', cacheControl('none'), validate(createCategorySchema), createCategory);
router.patch('/:id', cacheControl('none'), updateCategory);
router.delete('/:id', cacheControl('none'), deleteCategory);

export default router;
