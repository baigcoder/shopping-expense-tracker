import { beforeEach, describe, expect, it, vi } from 'vitest';
import { sendSignupOTP } from '../otpController.js';

const mockPrisma = vi.hoisted(() => ({
    emailOTP: {
        findFirst: vi.fn(),
        deleteMany: vi.fn(),
        create: vi.fn(),
    },
}));

const mockListUsers = vi.hoisted(() => vi.fn());
const mockSendOTPEmail = vi.hoisted(() => vi.fn());

vi.mock('../../config/prisma.js', () => ({
    default: mockPrisma,
}));

vi.mock('../../config/supabase.js', () => ({
    supabaseAdmin: {
        auth: {
            admin: {
                listUsers: mockListUsers,
            },
        },
    },
}));

vi.mock('../../services/emailService.js', () => ({
    generateOTP: () => '123456',
    getOTPExpiry: () => new Date('2030-01-01T00:00:00.000Z'),
    sendOTPEmail: mockSendOTPEmail,
}));

const createResponse = () => {
    const res: any = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res;
};

describe('OTP Controller', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockListUsers.mockResolvedValue({ data: { users: [] } });
        mockPrisma.emailOTP.findFirst.mockResolvedValue(null);
        mockPrisma.emailOTP.deleteMany.mockResolvedValue({ count: 0 });
        mockPrisma.emailOTP.create.mockResolvedValue({
            id: 'otp-1',
            email: 'new@example.com',
        });
    });

    it('removes the pending signup OTP when email delivery fails', async () => {
        mockSendOTPEmail.mockResolvedValue(false);

        const req: any = {
            body: {
                email: 'New@Example.com',
                password: 'Password123!',
                name: 'New User',
            },
        };
        const res = createResponse();

        await sendSignupOTP(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(mockPrisma.emailOTP.create).toHaveBeenCalledOnce();
        expect(mockPrisma.emailOTP.deleteMany).toHaveBeenCalledTimes(2);
        expect(mockPrisma.emailOTP.deleteMany).toHaveBeenLastCalledWith({
            where: {
                email: 'new@example.com',
                verified: false,
            },
        });
    });
});
