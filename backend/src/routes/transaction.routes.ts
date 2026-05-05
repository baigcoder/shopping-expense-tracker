// Transaction Routes
import { Router } from 'express';
import {
    getTransactions,
    getTransaction,
    createTransaction,
    createDetectedTransaction,
    updateTransaction,
    deleteTransaction,
    getRecentTransactions
} from '../controllers/transactionController.js';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createTransactionSchema, detectedTransactionSchema, updateTransactionSchema } from '../validators/schemas.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

router.get('/', getTransactions);
router.get('/recent', getRecentTransactions);
router.post('/detected', validate(detectedTransactionSchema), createDetectedTransaction);
router.get('/:id', getTransaction);
router.post('/', validate(createTransactionSchema), createTransaction);
router.patch('/:id', validate(updateTransactionSchema), updateTransaction);
router.delete('/:id', deleteTransaction);

export default router;
