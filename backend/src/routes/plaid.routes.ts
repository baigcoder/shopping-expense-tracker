// Plaid Bank Connection Routes
import { Router } from 'express';
import {
    createLinkToken,
    exchangePublicToken,
    getLinkedAccounts,
    syncTransactions,
    disconnectAccount,
    refreshBalances
} from '../controllers/plaid.controller.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// SECURITY: Enforce authentication on all Plaid bank connection endpoints
router.use(authMiddleware);

// Create Plaid Link token (starts the connection flow)
router.post('/create-link-token', createLinkToken);

// Exchange public token after successful Plaid Link
router.post('/exchange-token', exchangePublicToken);

// Get user's linked accounts
router.get('/accounts', getLinkedAccounts);

// Sync transactions from a linked account
router.post('/sync-transactions/:accountId', syncTransactions);

// Disconnect a linked account
router.delete('/disconnect/:accountId', disconnectAccount);

// Refresh account balance
router.get('/balance/:accountId', refreshBalances);

export default router;
