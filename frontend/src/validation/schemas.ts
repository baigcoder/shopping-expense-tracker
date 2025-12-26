// Zod Validation Schemas for Frontend Forms
import { z } from 'zod'

// ================================
// Transaction Schemas
// ================================

export const transactionFormSchema = z.object({
    amount: z
        .string()
        .min(1, 'Amount is required')
        .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
            message: 'Amount must be a positive number',
        }),
    storeName: z
        .string()
        .min(1, 'Store name is required')
        .max(100, 'Store name must be less than 100 characters'),
    storeUrl: z
        .string()
        .url('Invalid URL format')
        .optional()
        .or(z.literal('')),
    productName: z
        .string()
        .max(200, 'Product name must be less than 200 characters')
        .optional()
        .or(z.literal('')),
    categoryId: z.string().uuid('Invalid category ID').optional().or(z.literal('')),
    purchaseDate: z.string().min(1, 'Purchase date is required'),
    notes: z
        .string()
        .max(500, 'Notes must be less than 500 characters')
        .optional()
        .or(z.literal('')),
})

export type TransactionFormInput = z.infer<typeof transactionFormSchema>

// ================================
// Auth Schemas
// ================================

export const loginFormSchema = z.object({
    email: z
        .string()
        .min(1, 'Email is required')
        .email('Invalid email address'),
    password: z
        .string()
        .min(1, 'Password is required')
        .min(6, 'Password must be at least 6 characters'),
})

export type LoginFormInput = z.infer<typeof loginFormSchema>

export const signupFormSchema = z
    .object({
        name: z
            .string()
            .min(1, 'Name is required')
            .min(2, 'Name must be at least 2 characters')
            .max(50, 'Name must be less than 50 characters'),
        email: z
            .string()
            .min(1, 'Email is required')
            .email('Invalid email address'),
        password: z
            .string()
            .min(1, 'Password is required')
            .min(8, 'Password must be at least 8 characters')
            .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
            .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
            .regex(/[0-9]/, 'Password must contain at least one number'),
        confirmPassword: z.string().min(1, 'Please confirm your password'),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
    })

export type SignupFormInput = z.infer<typeof signupFormSchema>

// ================================
// Budget Schemas
// ================================

export const budgetFormSchema = z.object({
    amount: z
        .string()
        .min(1, 'Amount is required')
        .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
            message: 'Amount must be a positive number',
        }),
    period: z.enum(['weekly', 'monthly', 'yearly'] as const, {
        message: 'Invalid period',
    }),
    categoryId: z.string().uuid('Invalid category ID').optional().or(z.literal('')),
})

export type BudgetFormInput = z.infer<typeof budgetFormSchema>

// ================================
// Goal Schemas
// ================================

export const goalFormSchema = z.object({
    name: z
        .string()
        .min(1, 'Goal name is required')
        .max(100, 'Goal name must be less than 100 characters'),
    targetAmount: z
        .string()
        .min(1, 'Target amount is required')
        .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
            message: 'Target amount must be a positive number',
        }),
    currentAmount: z
        .string()
        .refine((val) => val === '' || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0), {
            message: 'Current amount must be a non-negative number',
        })
        .optional()
        .or(z.literal('')),
    deadline: z.string().optional().or(z.literal('')),
    description: z
        .string()
        .max(300, 'Description must be less than 300 characters')
        .optional()
        .or(z.literal('')),
})

export type GoalFormInput = z.infer<typeof goalFormSchema>

// ================================
// Profile Schemas
// ================================

export const profileFormSchema = z.object({
    name: z
        .string()
        .min(1, 'Name is required')
        .min(2, 'Name must be at least 2 characters')
        .max(50, 'Name must be less than 50 characters'),
    currency: z.string().length(3, 'Currency must be a 3-letter code'),
    avatarUrl: z
        .string()
        .url('Invalid URL format')
        .optional()
        .or(z.literal('')),
})

export type ProfileFormInput = z.infer<typeof profileFormSchema>

// ================================
// Utility Functions
// ================================

/**
 * Validate data against a schema and return formatted errors
 */
export function validateForm<T>(
    schema: z.ZodSchema<T>,
    data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string> } {
    const result = schema.safeParse(data)

    if (result.success) {
        return { success: true, data: result.data }
    }

    const errors: Record<string, string> = {}
    const zodError = result.error
    if (zodError && 'issues' in zodError) {
        zodError.issues.forEach((issue: z.ZodIssue) => {
            const path = issue.path.join('.')
            if (!errors[path]) {
                errors[path] = issue.message
            }
        })
    }

    return { success: false, errors }
}

/**
 * Get first error message from validation result
 */
export function getFirstError(
    schema: z.ZodSchema,
    data: unknown
): string | null {
    const result = schema.safeParse(data)

    if (result.success) {
        return null
    }

    const zodError = result.error
    if (zodError && 'issues' in zodError && zodError.issues.length > 0) {
        return zodError.issues[0]?.message || 'Validation failed'
    }

    return 'Validation failed'
}
