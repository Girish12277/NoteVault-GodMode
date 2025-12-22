// @ts-nocheck
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { Request, Response } from 'express';

// ------------------------------------------------------------------
// MOCKS
// ------------------------------------------------------------------

// Mock Email Service
jest.mock('../../../src/services/emailService', () => ({
    sendEmail: jest.fn()
}));

// Mock Prisma
const mockPrisma = {
    contactInquiry: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
        delete: jest.fn()
    }
};

jest.mock('../../../src/config/database', () => ({
    prisma: mockPrisma
}));

// ------------------------------------------------------------------
// IMPORTS
// ------------------------------------------------------------------
import { contactController } from '../../../src/controllers/contactController';
import { sendEmail } from '../../../src/services/emailService';

// Type casts for mocks
const mockSendEmail = sendEmail as jest.Mock;

// ------------------------------------------------------------------
// TEST SUITE
// ------------------------------------------------------------------

describe('Contact Controller - Brutal Unit Tests', () => {
    let req: any;
    let res: any;

    beforeEach(() => {
        jest.clearAllMocks();

        req = {
            body: {},
            params: {},
            query: {}
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
    });

    describe('submit', () => {
        const payload = {
            name: 'John Doe',
            email: 'john@example.com',
            phone: '1234567890',
            subject: 'Help',
            message: 'I need help'
        };

        it('should submit inquiry and send email', async () => {
            req.body = payload;
            mockPrisma.contactInquiry.create.mockResolvedValue({ id: 'inq-1', ...payload });
            mockSendEmail.mockResolvedValue(true);

            await contactController.submit(req, res);

            expect(mockPrisma.contactInquiry.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({ email: 'john@example.com' })
            }));
            expect(mockSendEmail).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });

        it('should return 201 even if email fails (non-blocking)', async () => {
            req.body = payload;
            mockPrisma.contactInquiry.create.mockResolvedValue({ id: 'inq-1' });
            mockSendEmail.mockRejectedValue(new Error('Email Fail'));
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

            await contactController.submit(req, res);

            // Wait for promise chain if necessary, but contactController doesn't await sendEmail catch
            // verifying response is enough
            expect(res.status).toHaveBeenCalledWith(201);
            consoleSpy.mockRestore();
        });

        it('should return 500 if DB fails', async () => {
            req.body = payload;
            mockPrisma.contactInquiry.create.mockRejectedValue(new Error('DB Fail'));
            await contactController.submit(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    describe('list', () => {
        it('should list inquiries with pagination', async () => {
            req.query = { page: '1', limit: '10', status: 'NEW' };

            mockPrisma.contactInquiry.findMany.mockResolvedValue(['inquiry1']);
            mockPrisma.contactInquiry.count.mockResolvedValue(1);

            await contactController.list(req, res);

            expect(mockPrisma.contactInquiry.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: { status: 'NEW' },
                take: 10,
                skip: 0
            }));
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    pagination: expect.objectContaining({ total: 1 })
                })
            }));
        });

        it('should search by keyword', async () => {
            req.query = { search: 'John' };
            mockPrisma.contactInquiry.findMany.mockResolvedValue([]);
            mockPrisma.contactInquiry.count.mockResolvedValue(0);

            await contactController.list(req, res);

            expect(mockPrisma.contactInquiry.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({
                    OR: expect.arrayContaining([{ name: expect.anything() }])
                })
            }));
        });
    });

    describe('updateStatus', () => {
        it('should update status', async () => {
            req.params.id = 'inq-1';
            req.body.status = 'READ';
            mockPrisma.contactInquiry.update.mockResolvedValue({ id: 'inq-1', status: 'READ' });

            await contactController.updateStatus(req, res);

            expect(mockPrisma.contactInquiry.update).toHaveBeenCalledWith(expect.objectContaining({
                where: { id: 'inq-1' },
                data: { status: 'READ' }
            }));
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });

        it('should return 500 on error', async () => {
            mockPrisma.contactInquiry.update.mockRejectedValue(new Error('Fail'));
            await contactController.updateStatus(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    describe('delete', () => {
        it('should delete inquiry', async () => {
            req.params.id = 'inq-1';
            mockPrisma.contactInquiry.delete.mockResolvedValue({ id: 'inq-1' });

            await contactController.delete(req, res);

            expect(mockPrisma.contactInquiry.delete).toHaveBeenCalledWith({ where: { id: 'inq-1' } });
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });

        it('should return 500 on error', async () => {
            mockPrisma.contactInquiry.delete.mockRejectedValue(new Error('Fail'));
            await contactController.delete(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
        });
    });
});
