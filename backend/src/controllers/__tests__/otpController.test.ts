import { beforeEach, describe, expect, it, vi } from 'vitest';
import { sendSignupOTP } from '../otpController.js';

const mockPrisma = vi.hoisted(() => ({
    user: {
        findUnique: vi.fn(),
    },
    emailOTP: {
        findFirst: vi.fn(),
        deleteMany: vi.fn(),
        create: vi.fn(),
    },
}));

const mockListUsers = vi.hoisted(() => vi.fn());
const mockCreateUser = vi.hoisted(() => vi.fn());
const mockDeleteUser = vi.hoisted(() => vi.fn());
const mockGetUserById = vi.hoisted(() => vi.fn());
const mockUpdateUserById = vi.hoisted(() => vi.fn());
const mockSendOTPEmail = vi.hoisted(() => vi.fn());

vi.mock('../../config/prisma.js', () => ({
    default: mockPrisma,
}));

vi.mock('../../config/supabase.js', () => ({
    supabaseAdmin: {
        auth: {
            admin: {
                listUsers: mockListUsers,
                createUser: mockCreateUser,
                deleteUser: mockDeleteUser,
                getUserById: mockGetUserById,
                updateUserById: mockUpdateUserById,
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
        mockPrisma.user.findUnique.mockResolvedValue(null);
        mockCreateUser.mockResolvedValue({ data: { user: { id: 'staged-uuid-999' } }, error: null });
        mockDeleteUser.mockResolvedValue({});
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

    it('never resets the password of an existing confirmed account', async () => {
        mockCreateUser.mockResolvedValue({ data: { user: null }, error: { message: 'User already registered' } });
        mockListUsers.mockResolvedValue({
            data: { users: [{ id: 'victim-uuid', email: 'victim@example.com', email_confirmed_at: '2026-01-01T00:00:00Z' }] },
        });

        const req: any = { body: { email: 'victim@example.com', password: 'Attacker123!' } };
        const res = createResponse();

        await sendSignupOTP(req, res);

        expect(mockUpdateUserById).not.toHaveBeenCalled();
        expect(mockSendOTPEmail).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('re-stages an unconfirmed account this signup flow created', async () => {
        mockSendOTPEmail.mockResolvedValue(true);
        mockCreateUser.mockResolvedValue({ data: { user: null }, error: { message: 'User already registered' } });
        mockPrisma.emailOTP.findFirst
            .mockResolvedValueOnce(null) // cooldown check
            .mockResolvedValueOnce({ metadata: JSON.stringify({ supabaseUserId: 'staged-uuid-1' }) });
        mockGetUserById.mockResolvedValue({
            data: { user: { id: 'staged-uuid-1', email: 'pending@example.com', email_confirmed_at: null } },
        });

        const req: any = { body: { email: 'pending@example.com', password: 'Password123!', name: 'Pat' } };
        const res = createResponse();

        await sendSignupOTP(req, res);

        expect(mockUpdateUserById).toHaveBeenCalledWith('staged-uuid-1', expect.objectContaining({ password: 'Password123!' }));
        expect(mockSendOTPEmail).toHaveBeenCalledOnce();
    });
});
