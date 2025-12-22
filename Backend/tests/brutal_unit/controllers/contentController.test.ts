import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { Request, Response } from 'express';

// ------------------------------------------------------------------
// MOCKS (Hoisted)
// ------------------------------------------------------------------

const mockPrisma = {
    siteContent: {
        findUnique: jest.fn() as any,
        upsert: jest.fn() as any,
    },
};

jest.mock('@prisma/client', () => ({
    PrismaClient: jest.fn(() => mockPrisma)
}));

// Import after mocking
const contentController = require('../../../src/controllers/contentController');

// ------------------------------------------------------------------
// TEST SUITE
// ------------------------------------------------------------------

describe('ContentController - Brutal Unit Tests', () => {
    let req: Partial<Request> & { params?: any, body?: any };
    let res: Partial<Response>;
    let jsonMock: jest.Mock;
    let statusMock: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        jsonMock = jest.fn();
        statusMock = jest.fn().mockReturnValue({ json: jsonMock });

        req = { params: {}, body: {} };
        res = { status: statusMock as any, json: jsonMock as any };
    });

    describe('getContent', () => {
        it('should return content by section', async () => {
            req.params = { section: 'about-us' };

            (mockPrisma.siteContent.findUnique as any).mockResolvedValue({
                section: 'about-us',
                content: 'About us content'
            });

            await contentController.getContent(req as Request, res as Response);

            expect(mockPrisma.siteContent.findUnique).toHaveBeenCalledWith({
                where: { section: 'about-us' }
            });

            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                section: 'about-us'
            }));
        });

        it('should return 404 if content not found', async () => {
            req.params = { section: 'non-existent' };

            (mockPrisma.siteContent.findUnique as any).mockResolvedValue(null);

            await contentController.getContent(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(404);
            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                code: 'CONTENT_NOT_FOUND'
            }));
        });

        it('should return 500 on database error', async () => {
            req.params = { section: 'test' };

            (mockPrisma.siteContent.findUnique as any).mockRejectedValue(new Error('DB Error'));

            await contentController.getContent(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
        });
    });

    describe('updateContent', () => {
        it('should upsert content', async () => {
            req.params = { section: 'terms' };
            req.body = { content: 'Updated terms content' };

            (mockPrisma.siteContent.upsert as any).mockResolvedValue({
                section: 'terms',
                content: 'Updated terms content'
            });

            await contentController.updateContent(req as Request, res as Response);

            expect(mockPrisma.siteContent.upsert).toHaveBeenCalledWith({
                where: { section: 'terms' },
                update: { content: 'Updated terms content' },
                create: { section: 'terms', content: 'Updated terms content' }
            });

            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                section: 'terms'
            }));
        });

        it('should return 500 on upsert error', async () => {
            req.params = { section: 'test' };
            req.body = { content: 'test' };

            (mockPrisma.siteContent.upsert as any).mockRejectedValue(new Error('Upsert failed'));

            await contentController.updateContent(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
        });
    });
});
