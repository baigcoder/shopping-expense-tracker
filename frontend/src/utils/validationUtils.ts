// Validation Utilities - Gen-Z Friendly Error Messages
// Provides email validation, password strength checking, and form validation helpers

/**
 * Email validation using RFC 5322 compliant regex
 */
export const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
};

/**
 * Password strength levels
 */
export enum PasswordStrength {
    WEAK = 'weak',
    FAIR = 'fair',
    GOOD = 'good',
    STRONG = 'strong'
}

/**
 * Password strength result
 */
export interface PasswordStrengthResult {
    strength: PasswordStrength;
    score: number; // 0-100
    feedback: string;
    requirements: {
        minLength: boolean;
        hasUpperCase: boolean;
        hasLowerCase: boolean;
        hasNumber: boolean;
        hasSpecialChar: boolean;
    };
}

/**
 * Calculate password strength with Gen-Z friendly feedback
 */
export const checkPasswordStrength = (password: string): PasswordStrengthResult => {
    const requirements = {
        minLength: password.length >= 8,
        hasUpperCase: /[A-Z]/.test(password),
        hasLowerCase: /[a-z]/.test(password),
        hasNumber: /[0-9]/.test(password),
        hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    // Calculate score based on requirements met
    const requirementsMet = Object.values(requirements).filter(Boolean).length;
    let score = 0;

    if (requirements.minLength) score += 20;
    if (requirements.hasUpperCase) score += 20;
    if (requirements.hasLowerCase) score += 20;
    if (requirements.hasNumber) score += 20;
    if (requirements.hasSpecialChar) score += 20;

    // Determine strength level
    let strength: PasswordStrength;
    let feedback: string;

    if (score < 40) {
        strength = PasswordStrength.WEAK;
        feedback = "Yikes! This password is weak sauce. 😬";
    } else if (score < 60) {
        strength = PasswordStrength.FAIR;
        feedback = "Meh, could be better. Add more variety! 🤔";
    } else if (score < 80) {
        strength = PasswordStrength.GOOD;
        feedback = "Not bad! Almost there. 💪";
    } else {
        strength = PasswordStrength.STRONG;
        feedback = "Now we're talking! Strong password! 🔥";
    }

    return {
        strength,
        score,
        feedback,
        requirements
    };
};

/**
 * Gen-Z friendly error messages for common validation errors
 */
export const getValidationMessage = (field: string, error: string): string => {
    const messages: Record<string, Record<string, string>> = {
        email: {
            required: "Hold up! We need your email. 📧",
            invalid: "That email looks sus... Try again? 🤨",
            taken: "This email's already vibing with us! Try logging in instead. 👋"
        },
        password: {
            required: "Password can't be empty bestie! 🔐",
            tooShort: "Password needs to be at least 8 characters! 💪",
            weak: "This password is too weak! Make it stronger. 🛡️",
            mismatch: "Passwords don't match! Double check. 👀"
        },
        name: {
            required: "What should we call you? 🤔",
            tooShort: "Name's a bit short... Give us more! ✨"
        },
        general: {
            required: "This field is required! Don't skip it. 📝",
            invalid: "Something's not right here... 🤔",
            network: "Network's acting up. Try again? 📡",
            unknown: "Oops! Something went wrong. Our bad! 😅"
        }
    };

    return messages[field]?.[error] || messages.general[error] || messages.general.unknown;
};

/**
 * Validate form field and return error message if invalid
 */
export const validateField = (
    field: string,
    value: string,
    options?: {
        minLength?: number;
        maxLength?: number;
        required?: boolean;
        pattern?: RegExp;
    }
): string | null => {
    const { minLength = 0, maxLength = Infinity, required = true, pattern } = options || {};

    // Check if required
    if (required && !value.trim()) {
        return getValidationMessage(field, 'required');
    }

    // Check length
    if (value.length < minLength) {
        return getValidationMessage(field, 'tooShort');
    }

    if (value.length > maxLength) {
        return `Keep it under ${maxLength} characters! 📏`;
    }

    // Check pattern
    if (pattern && !pattern.test(value)) {
        return getValidationMessage(field, 'invalid');
    }

    // Field-specific validation
    if (field === 'email' && !isValidEmail(value)) {
        return getValidationMessage('email', 'invalid');
    }

    if (field === 'password' && value.length < 6) {
        return getValidationMessage('password', 'tooShort');
    }

    return null;
};

/**
 * Validate entire form and return errors object
 */
export const validateForm = (
    fields: Record<string, string>,
    rules: Record<string, { required?: boolean; minLength?: number; pattern?: RegExp }>
): Record<string, string> => {
    const errors: Record<string, string> = {};

    Object.entries(fields).forEach(([field, value]) => {
        const rule = rules[field];
        if (rule) {
            const error = validateField(field, value, rule);
            if (error) {
                errors[field] = error;
            }
        }
    });

    return errors;
};

/**
 * Check if passwords match
 */
export const doPasswordsMatch = (password: string, confirmPassword: string): boolean => {
    return password === confirmPassword && password.length > 0;
};

/**
 * Sanitize input to prevent XSS
 */
export const sanitizeInput = (input: string): string => {
    return input
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
};

/**
 * Format error message from Supabase to be more user-friendly
 */
export const formatSupabaseError = (error: any): string => {
    const errorMessage = error?.message?.toLowerCase() || '';

    if (errorMessage.includes('invalid login credentials')) {
        return "Wrong email or password! Try again. 🔐";
    }

    if (errorMessage.includes('email not confirmed')) {
        return "Please verify your email first! 📧";
    }

    if (errorMessage.includes('user already registered')) {
        return "Email already registered! Try logging in. 👋";
    }

    if (errorMessage.includes('network')) {
        return getValidationMessage('general', 'network');
    }

    if (errorMessage.includes('rate limit')) {
        return "Whoa! Slow down there. Too many attempts. Try again in a bit. ⏰";
    }

    return error?.message || getValidationMessage('general', 'unknown');
};
