// Zod Validation Schemas
import { z } from 'zod';

// Auth Schemas
export const registerSchema = z.object({
    firebaseUid: z.string().min(1, 'Firebase UID is required'),
    email: z.string().email('Invalid email address'),
    name: z.string().optional(),
    avatarUrl: z.string().url().optional(),
});

// Transaction Schemas
export const createTransactionSchema = z.object({
    amount: z.number().positive('Amount must be positive'),
    currency: z.string().length(3).default('USD'),
    storeName: z.string().min(1, 'Store name is required').max(100),
    storeUrl: z.string().url().optional().nullable(),
    productName: z.string().max(200).optional().nullable(),
    categoryId: z.string().uuid().optional().nullable(),
    category: z.string().max(100).optional().nullable(),
    purchaseDate: z.string().datetime().optional(),
    notes: z.string().max(500).optional().nullable(),
});

export const updateTransactionSchema = createTransactionSchema.partial();

export const detectedTransactionSchema = z.object({
    transactionHash: z.string().max(128).optional(),
    idempotencyKey: z.string().max(128).optional(),
    name: z.string().max(200).optional(),
    description: z.string().max(500).optional(),
    serviceName: z.string().max(200).optional(),
    storeName: z.string().max(100).optional(),
    merchantName: z.string().max(200).optional(),
    merchant_name: z.string().max(200).optional(),
    productName: z.string().max(200).optional(),
    hostname: z.string().max(255).optional(),
    sourceUrl: z.string().max(1000).optional(),
    storeUrl: z.string().max(1000).optional(),
    amount: z.coerce.number().nonnegative().optional(),
    price: z.coerce.number().nonnegative().optional(),
    currency: z.string().min(3).max(8).optional(),
    type: z.string().max(50).optional(),
    category: z.string().max(100).optional(),
    detectedAt: z.string().optional(),
    date: z.string().optional(),
    source: z.string().max(100).optional(),
    billingCycle: z.string().max(50).optional(),
    isTrial: z.boolean().optional(),
    isSubscription: z.boolean().optional(),
    trialDays: z.coerce.number().int().nonnegative().optional(),
    planTier: z.string().max(100).optional(),
    confidence: z.coerce.number().min(0).max(1).optional(),
    detectionConfidence: z.coerce.number().min(0).max(1).optional(),
    detectionSignals: z.array(z.string().max(120)).optional(),
    behaviorFlow: z.array(z.any()).optional(),
    rawPayload: z.record(z.any()).optional(),
    notes: z.string().max(1000).optional(),
});

export const transactionCandidateSchema = z.object({
    source: z.enum(['extension', 'pdf', 'csv', 'excel', 'plaid', 'ai', 'manual_review']).default('manual_review'),
    description: z.string().min(1).max(500),
    amount: z.coerce.number().nonnegative(),
    date: z.string().optional(),
    type: z.enum(['income', 'expense']).default('expense'),
    category: z.string().max(100).optional(),
    merchantName: z.string().max(200).optional(),
    merchant_name: z.string().max(200).optional(),
    rawPayload: z.record(z.any()).optional(),
    raw_payload: z.record(z.any()).optional(),
    confidence: z.coerce.number().min(0).max(1).optional(),
    transactionHash: z.string().max(128).optional(),
    transaction_hash: z.string().max(128).optional(),
    importSessionId: z.string().uuid().optional(),
    import_session_id: z.string().uuid().optional(),
});

export const approveCandidateSchema = z.object({
    description: z.string().min(1).max(500).optional(),
    amount: z.coerce.number().nonnegative().optional(),
    date: z.string().optional(),
    type: z.enum(['income', 'expense']).optional(),
    category: z.string().max(100).optional(),
    merchantName: z.string().max(200).optional(),
});

export const mergeCandidateSchema = z.object({
    transactionId: z.string().uuid(),
});

export const bulkCandidateSchema = z.object({
    ids: z.array(z.string().uuid()).min(1).max(100),
    action: z.enum(['approve', 'reject', 'category', 'type', 'date']),
    updates: z.object({
        category: z.string().max(100).optional(),
        type: z.enum(['income', 'expense']).optional(),
        date: z.string().optional(),
    }).optional(),
});

const merchantRuleBaseSchema = z.object({
    merchantPattern: z.string().min(1).max(200).optional(),
    merchant_pattern: z.string().min(1).max(200).optional(),
    matchType: z.enum(['exact', 'contains', 'starts_with', 'regex']).optional(),
    match_type: z.enum(['exact', 'contains', 'starts_with', 'regex']).optional(),
    category: z.string().min(1).max(100),
    transactionType: z.enum(['income', 'expense']).optional(),
    transaction_type: z.enum(['income', 'expense']).optional(),
    amountMin: z.coerce.number().nonnegative().nullable().optional(),
    amount_min: z.coerce.number().nonnegative().nullable().optional(),
    amountMax: z.coerce.number().nonnegative().nullable().optional(),
    amount_max: z.coerce.number().nonnegative().nullable().optional(),
    priority: z.coerce.number().int().optional(),
    enabled: z.boolean().optional(),
});

export const merchantRuleSchema = merchantRuleBaseSchema.refine((data) => data.merchantPattern || data.merchant_pattern, {
    message: 'merchantPattern is required',
});

export const updateMerchantRuleSchema = merchantRuleBaseSchema.partial();

export const importSessionSchema = z.object({
    fileName: z.string().min(1).max(255).optional(),
    file_name: z.string().min(1).max(255).optional(),
    fileType: z.enum(['pdf', 'csv', 'excel', 'image', 'docx', 'unknown']).optional(),
    file_type: z.enum(['pdf', 'csv', 'excel', 'image', 'docx', 'unknown']).optional(),
    rows: z.array(z.object({
        description: z.string().max(500).optional(),
        amount: z.coerce.number().optional(),
        date: z.string().optional(),
        type: z.enum(['income', 'expense']).optional(),
        category: z.string().max(100).optional(),
        merchantName: z.string().max(200).optional(),
        merchant_name: z.string().max(200).optional(),
        confidence: z.coerce.number().min(0).max(1).optional(),
        duplicateWarning: z.boolean().optional(),
        duplicate_warning: z.boolean().optional(),
        validationErrors: z.array(z.string()).optional(),
        validation_errors: z.array(z.string()).optional(),
        selected: z.boolean().optional(),
        rawPayload: z.record(z.any()).optional(),
        raw_payload: z.record(z.any()).optional(),
    })).default([]),
}).refine((data) => data.fileName || data.file_name, {
    message: 'fileName is required',
});

export const commitImportSessionSchema = z.object({
    rowIds: z.array(z.string().uuid()).optional(),
});

export const extensionHealthEventSchema = z.object({
    eventType: z.string().max(100).optional(),
    event_type: z.string().max(100).optional(),
    status: z.string().max(50).optional(),
    siteHostname: z.string().max(255).optional(),
    site_hostname: z.string().max(255).optional(),
    siteName: z.string().max(255).optional(),
    site_name: z.string().max(255).optional(),
    queuedCount: z.coerce.number().int().nonnegative().optional(),
    queued_count: z.coerce.number().int().nonnegative().optional(),
    failedCount: z.coerce.number().int().nonnegative().optional(),
    failed_count: z.coerce.number().int().nonnegative().optional(),
    permissionStatus: z.string().max(100).optional(),
    permission_status: z.string().max(100).optional(),
    message: z.string().max(1000).optional(),
    details: z.record(z.any()).optional(),
});

export const generateReportSchema = z.object({
    reportType: z.enum(['tax', 'category', 'merchant', 'subscription', 'monthly_summary']).optional(),
    report_type: z.enum(['tax', 'category', 'merchant', 'subscription', 'monthly_summary']).optional(),
    startDate: z.string().optional(),
    start_date: z.string().optional(),
    endDate: z.string().optional(),
    end_date: z.string().optional(),
    format: z.string().max(50).optional(),
});

export const settingsProfileSchema = z.object({
    name: z.string().max(120).optional().nullable(),
    avatarUrl: z.string().url().optional().nullable(),
    avatar_url: z.string().url().optional().nullable(),
});

export const settingsPreferencesSchema = z.object({
    emailNotifications: z.boolean().optional(),
    email_notifications: z.boolean().optional(),
    pushNotifications: z.boolean().optional(),
    push_notifications: z.boolean().optional(),
    weeklyReport: z.boolean().optional(),
    weekly_report: z.boolean().optional(),
    monthlyReport: z.boolean().optional(),
    monthly_report: z.boolean().optional(),
    soundEnabled: z.boolean().optional(),
    sound_enabled: z.boolean().optional(),
    soundVolume: z.coerce.number().int().min(0).max(100).optional(),
    sound_volume: z.coerce.number().int().min(0).max(100).optional(),
    theme: z.enum(['light', 'dark']).optional(),
    reducedMotion: z.boolean().optional(),
    reduced_motion: z.boolean().optional(),
    currency: z.string().length(3).optional(),
});

export const settingsAISchema = z.object({
    aiLiveEnabled: z.boolean().optional(),
    ai_live_enabled: z.boolean().optional(),
    aiMemoryEnabled: z.boolean().optional(),
    ai_memory_enabled: z.boolean().optional(),
    aiAutoRefresh: z.boolean().optional(),
    ai_auto_refresh: z.boolean().optional(),
    aiIncludePendingCandidates: z.boolean().optional(),
    ai_include_pending_candidates: z.boolean().optional(),
});

export const settingsResetRequestSchema = z.object({
    category: z.enum(['transactions', 'goals', 'subscriptions', 'bills', 'cards', 'all']),
});

export const settingsResetConfirmSchema = z.object({
    otp: z.string().min(4).max(12),
});

// Category Schemas
export const createCategorySchema = z.object({
    name: z.string().min(1, 'Category name is required').max(50),
    icon: z.string().max(10).default('🏷️'),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color').default('#6366f1'),
});

// Budget Schemas
export const createBudgetSchema = z.object({
    amount: z.number().positive('Budget amount must be positive'),
    period: z.enum(['weekly', 'monthly', 'yearly']),
    categoryId: z.string().uuid().optional().nullable(),
});

// Query Schemas
export const paginationSchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
});

export const dateRangeSchema = z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
export type DetectedTransactionInput = z.infer<typeof detectedTransactionSchema>;
export type TransactionCandidateInput = z.infer<typeof transactionCandidateSchema>;
export type ApproveCandidateInput = z.infer<typeof approveCandidateSchema>;
export type MergeCandidateInput = z.infer<typeof mergeCandidateSchema>;
export type BulkCandidateInput = z.infer<typeof bulkCandidateSchema>;
export type MerchantRuleInput = z.infer<typeof merchantRuleSchema>;
export type ImportSessionInput = z.infer<typeof importSessionSchema>;
export type CommitImportSessionInput = z.infer<typeof commitImportSessionSchema>;
export type ExtensionHealthEventInput = z.infer<typeof extensionHealthEventSchema>;
export type GenerateReportInput = z.infer<typeof generateReportSchema>;
export type SettingsProfileInput = z.infer<typeof settingsProfileSchema>;
export type SettingsPreferencesInput = z.infer<typeof settingsPreferencesSchema>;
export type SettingsAIInput = z.infer<typeof settingsAISchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type CreateBudgetInput = z.infer<typeof createBudgetSchema>;
