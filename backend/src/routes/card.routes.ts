// Card Routes - REST API endpoints for card management
import { Router } from 'express';
import {
    getCards,
    getCardById,
    createCard,
    updateCard,
    deleteCard
} from '../controllers/cardController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Card CRUD operations
router.get('/', getCards);
router.get('/:id', getCardById);
router.post('/', createCard);
router.patch('/:id', updateCard);
router.delete('/:id', deleteCard);

export default router;
