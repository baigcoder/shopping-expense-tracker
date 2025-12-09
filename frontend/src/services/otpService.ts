// OTP Service - API calls for email OTP verification
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface OTPResponse {
    success: boolean;
    message: string;
    email?: string;
    error?: string;
    retryAfter?: number;
    remainingAttempts?: number;
    user?: {
        id: string;
        email: string;
        name: string;
    };
}

// Send OTP for signup
export const sendSignupOTP = async (
    email: string,
    password: string,
    name?: string
): Promise<OTPResponse> => {
    try {
        const response = await fetch(`${API_URL}/otp/send`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password, name }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to send verification code');
        }

        return data;
    } catch (error: any) {
        throw new Error(error.message || 'Failed to send verification code');
    }
};

// Verify OTP and complete signup
export const verifyOTP = async (email: string, otp: string): Promise<OTPResponse> => {
    try {
        const response = await fetch(`${API_URL}/otp/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, otp }),
        });

        const data = await response.json();

        if (!response.ok) {
            const error = new Error(data.error || 'Failed to verify code');
            (error as any).remainingAttempts = data.remainingAttempts;
            throw error;
        }

        return data;
    } catch (error: any) {
        throw error;
    }
};

// Resend OTP
export const resendOTP = async (email: string): Promise<OTPResponse> => {
    try {
        const response = await fetch(`${API_URL}/otp/resend`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email }),
        });

        const data = await response.json();

        if (!response.ok) {
            const error = new Error(data.error || 'Failed to resend code');
            (error as any).retryAfter = data.retryAfter;
            throw error;
        }

        return data;
    } catch (error: any) {
        throw error;
    }
};
