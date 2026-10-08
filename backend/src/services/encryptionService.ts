// Authenticated Encryption Service (AES-256-GCM)
// Used for high-security storage of external provider tokens (e.g. Plaid access tokens)
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits recommended for GCM
const AUTH_TAG_LENGTH = 16; // 128 bits

function getMasterKey(): Buffer {
    const rawKey = (process.env.PLAID_ENCRYPTION_KEY || process.env.ENCRYPTION_MASTER_KEY || '').trim();

    if (!rawKey) {
        if (process.env.NODE_ENV === 'production') {
            throw new Error('CRITICAL SECURITY ERROR: PLAID_ENCRYPTION_KEY must be defined in production.');
        }
        // In local non-production development only, if no key is set, derive a deterministic local test key
        // but log an explicit warning so it is never overlooked.
        console.warn('⚠️ [SECURITY WARNING] PLAID_ENCRYPTION_KEY not set in development. Using localized fallback.');
        return crypto.createHash('sha256').update('cashly_dev_local_only_key_never_production').digest();
    }

    // Support 64-char hex, base64, or raw 32-byte strings
    if (/^[0-9a-fA-F]{64}$/.test(rawKey)) {
        return Buffer.from(rawKey, 'hex');
    }

    const keyBuf = Buffer.from(rawKey, 'utf8');
    if (keyBuf.length === 32) {
        return keyBuf;
    }

    // Derive a fixed 32-byte key via SHA-256 if arbitrary length
    return crypto.createHash('sha256').update(keyBuf).digest();
}

/**
 * Encrypt a sensitive token using AES-256-GCM with authentication tag
 * Format: iv_hex:authTag_hex:ciphertext_hex
 */
export function encryptToken(plainText: string): string {
    if (!plainText) return '';
    const key = getMasterKey();
    const iv = crypto.randomBytes(IV_LENGTH);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
        authTagLength: AUTH_TAG_LENGTH
    });

    let encrypted = cipher.update(plainText, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();

    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt a token encrypted with encryptToken
 */
export function decryptToken(cipherText: string): string {
    if (!cipherText) return '';

    // If it is an unencrypted legacy token, return it as-is for migration compatibility
    if (!isEncryptedToken(cipherText)) {
        return cipherText;
    }

    const parts = cipherText.split(':');
    if (parts.length !== 3) {
        throw new Error('Invalid encrypted token format');
    }

    const [ivHex, authTagHex, encryptedHex] = parts;
    const key = getMasterKey();
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
        authTagLength: AUTH_TAG_LENGTH
    });

    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}

/**
 * Check if a token string is in encrypted AES-GCM format
 */
export function isEncryptedToken(value: string): boolean {
    if (!value || typeof value !== 'string') return false;
    const parts = value.split(':');
    return parts.length === 3 &&
        parts[0].length === IV_LENGTH * 2 &&
        parts[1].length === AUTH_TAG_LENGTH * 2 &&
        parts[2].length > 0;
}
