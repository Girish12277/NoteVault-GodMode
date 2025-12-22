import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { Request, Response } from 'express';

// Mocks BEFORE imports
const mockUploadService = {
    uploadNotePdf: jest.fn() as any,
    uploadPreviewImage: jest.fn() as any,
};

const mockKafkaEventService = {
    trackEvent: (jest.fn() as any).mockResolvedValue(true),
};

const mockGorseService = {
    trackInteraction: (jest.fn() as any).mockResolvedValue(true),
    upsertNote: (jest.fn() as any).mockResolvedValue(true),
};

// Safe to hoist these because they don't depend on imports
jest.mock('../../../src/services/uploadService', () => ({ __esModule: true, uploadService: mockUploadService }));
jest.mock('../../../src/services/kafkaEventService', () => ({ __esModule: true, kafkaEventService: mockKafkaEventService }));
jest.mock('../../../src/services/gorseRecommendationService', () => ({ __esModule: true, gorseService: mockGorseService }));
jest.mock('../../../src/services/cacheService', () => ({ __esModule: true, cacheService: { get: jest.fn(), set: jest.fn(), delPattern: jest.fn() }, cacheKeys: { notesList: jest.fn(), noteDetail: jest.fn() }, cacheTTL: {} }));

// Mock DOMPurify (Dynamic Import)
jest.mock('dompurify', () => {
    return jest.fn(() => ({
        sanitize: jest.fn((str) => str), // Identity for testing
    }));
}, { virtual: true });
jest.mock('jsdom', () => ({ JSDOM: class { window = {}; } }), { virtual: true });


// Cloudinary Mock
const mockCloudinary = {
    utils: {
        private_download_url: jest.fn(),
    },
};
jest.mock('../../../src/config/cloudinary', () => ({
    __esModule: true,
    cloudinary: mockCloudinary,
    default: mockCloudinary
}));

// Prisma Mock - INLINED to avoid TDZ
jest.mock('../../../src/config/database', () => ({
    __esModule: true,
    prisma: {
        notes: {
            findMany: jest.fn(),
            count: jest.fn(),
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            findFirst: jest.fn(),
        },
        users: {
            findUnique: jest.fn(),
        },
        universities: {
            findFirst: jest.fn(),
        },
        purchases: {
            findFirst: jest.fn(),
            update: jest.fn(),
        },
        Wishlist: {
            findUnique: jest.fn(),
        },
    }
}));

// Imports AFTER mocks
import { noteController } from '../../../src/controllers/noteController';
import { cacheService } from '../../../src/services/cacheService';
import { prisma } from '../../../src/config/database';

// Helper to access mocks strictly
const mockPrisma = prisma as any;

describe('Note Controller Brutal Tests', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let jsonMock: jest.Mock;
    let statusMock: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        jsonMock = jest.fn();
        statusMock = jest.fn().mockReturnValue({ json: jsonMock });
        req = {
            body: {},
            query: {},
            params: {},
            files: {},
            user: { id: 'user_1' } as any
        } as any;
        res = {
            status: statusMock as any,
            json: jsonMock as any,
        };
        (cacheService.get as any).mockResolvedValue(null); // No cache hit by default
    });

    describe('list', () => {
        it('should list notes with pagination', async () => {
            mockPrisma.notes.findMany.mockResolvedValue([]);
            mockPrisma.notes.count.mockResolvedValue(0);

            await noteController.list(req as Request, res as Response);

            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
            expect(mockPrisma.notes.findMany).toHaveBeenCalled();
        });

        it('should return cached result if available', async () => {
            (cacheService.get as any).mockResolvedValue({ cached: true });

            await noteController.list(req as Request, res as Response);

            expect(jsonMock).toHaveBeenCalledWith({ cached: true });
            expect(mockPrisma.notes.findMany).not.toHaveBeenCalled();
        });
    });

    describe('getById', () => {
        it('should return note detail and increment view count', async () => {
            req.params = { id: 'n1' };
            const note = {
                id: 'n1',
                title: 'Note',
                seller_id: 's1',
                price_inr: 100,
                is_active: true,
                file_type: 'pdf'
            };
            mockPrisma.notes.findUnique.mockResolvedValue(note);
            mockPrisma.notes.update.mockResolvedValue({}); // View count

            await noteController.getById(req as Request, res as Response);

            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
            expect(mockPrisma.notes.update).toHaveBeenCalled();
        });

        it('should return 404 if note not found', async () => {
            req.params = { id: 'n1' };
            mockPrisma.notes.findUnique.mockResolvedValue(null);

            await noteController.getById(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(404);
        });
    });

    describe('create', () => {
        it('should create note if user is seller', async () => {
            req.user = { id: 'seller_1' } as any;
            req.files = { file: [{ buffer: Buffer.from('pdf'), originalname: 'note.pdf', size: 100, mimetype: 'application/pdf' }] } as any;
            req.body = {
                title: 'New Note',
                description: 'Desc',
                subject: 'Subj',
                collegeName: 'Col',
                priceInr: '100',
                totalPages: '10',
                universityId: 'u1',
                previewPages: []
            };

            mockPrisma.users.findUnique.mockResolvedValue({ id: 'seller_1', is_seller: true });
            mockUploadService.uploadNotePdf.mockResolvedValue({ secureUrl: 'url' });
            mockPrisma.notes.create.mockResolvedValue({ id: 'n1', title: 'New Note' });

            // Mock university fallback
            mockPrisma.universities.findFirst.mockResolvedValue({ id: 'u1' });

            await noteController.create(req as any, res as Response);

            expect(statusMock).toHaveBeenCalledWith(201);
            expect(mockPrisma.notes.create).toHaveBeenCalled();
        });

        it('should forbid non-sellers', async () => {
            req.user = { id: 'buyer_1' } as any;
            mockPrisma.users.findUnique.mockResolvedValue({ id: 'buyer_1', is_seller: false });

            await noteController.create(req as any, res as Response);

            expect(statusMock).toHaveBeenCalledWith(403);
        });
    });

    describe('download', () => {
        it('should generate download link for purchaser', async () => {
            req.params = { id: 'n1' };
            req.user = { id: 'buyer_1' } as any;

            mockPrisma.notes.findUnique.mockResolvedValue({
                id: 'n1',
                seller_id: 'seller_1',
                file_url: 'https://res.cloudinary.com/demo/raw/upload/v1/notes/foobar.pdf',
                is_active: true
            });
            mockPrisma.purchases.findFirst.mockResolvedValue({ id: 'p1' });

            mockCloudinary.utils.private_download_url.mockReturnValue('https://signed.url');

            await noteController.download(req as any, res as Response);

            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                data: expect.objectContaining({ downloadUrl: 'https://signed.url' })
            }));
        });

        it('should deny if not purchased', async () => {
            req.params = { id: 'n1' };
            req.user = { id: 'buyer_1' } as any;

            mockPrisma.notes.findUnique.mockResolvedValue({
                id: 'n1', seller_id: 'seller_1', is_active: true
            });
            mockPrisma.purchases.findFirst.mockResolvedValue(null);

            await noteController.download(req as any, res as Response);

            expect(statusMock).toHaveBeenCalledWith(403);
        });
    });
});
