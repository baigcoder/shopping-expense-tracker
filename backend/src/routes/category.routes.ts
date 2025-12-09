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

const router = Router();

// All routes require authentication
router.use(authMiddleware);

router.get('/', getCategories);
router.post('/', validate(createCategorySchema), createCategory);
router.patch('/:id', updateCategory);
router.delete('/:id', deleteCategory);

export default router;
