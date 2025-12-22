// @ts-nocheck
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import cloudinary from 'cloudinary';
import { PDFDocument } from 'pdf-lib';
import fetch from 'node-fetch';

const mockCloudinary = {
    v2: {
        config: jest.fn(),
        url: jest.fn(),
        uploader: {
            upload_stream: jest.fn()
        }
    }
};

jest.mock('cloudinary', () => ({
    __esModule: true,
    default: mockCloudinary,
    v2: mockCloudinary.v2 // Ensure v2 is available on default import if needed, or structured like implementation
}));

// Jest manual mock for node-fetch
jest.mock('node-fetch', () => jest.fn());

const mockPdfDoc = {
    embedFont: jest.fn(),
    getPages: jest.fn(),
    save: jest.fn()
};

jest.mock('pdf-lib', () => ({
    PDFDocument: {
        load: jest.fn(() => Promise.resolve(mockPdfDoc))
    },
    rgb: jest.fn(),
    StandardFonts: { Helvetica: 'Helvetica' },
    degrees: jest.fn()
}));

import { getSignedDownloadUrl, watermarkAndUploadPdf } from '../../../src/services/cloudinaryService';

describe('CloudinaryService - Brutal Unit Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getSignedDownloadUrl', () => {
        it('should generate url', () => {
            mockCloudinary.v2.url.mockReturnValue('http://signed-url');

            const url = getSignedDownloadUrl('public-id');

            expect(url).toBe('http://signed-url');
            expect(mockCloudinary.v2.url).toHaveBeenCalledWith('public-id', expect.objectContaining({
                sign_url: true,
                type: 'authenticated'
            }));
        });
    });

    describe('watermarkAndUploadPdf', () => {
        it('should download, watermark, and upload pdf', async () => {
            // Mock fetch response
            (fetch as any).mockResolvedValue({
                ok: true,
                arrayBuffer: () => Promise.resolve(new ArrayBuffer(10))
            });

            // Mock PDF pages
            const mockPage = {
                getSize: () => ({ width: 100, height: 100 }),
                drawText: jest.fn()
            };
            mockPdfDoc.getPages.mockReturnValue([mockPage]);
            mockPdfDoc.embedFont.mockResolvedValue('font');
            mockPdfDoc.save.mockResolvedValue(new Uint8Array(10));

            // Mock upload stream
            mockCloudinary.v2.uploader.upload_stream.mockImplementation((opts: any, cb: any) => {
                cb(null, { public_id: 'pid', secure_url: 'url', bytes: 100 });
                return { end: jest.fn() };
            });

            const result = await watermarkAndUploadPdf('http://orig', 'watermark');

            expect(result.public_id).toBe('pid');
            expect(fetch).toHaveBeenCalledWith('http://orig');
            expect(mockPage.drawText).toHaveBeenCalled();
            expect(mockCloudinary.v2.uploader.upload_stream).toHaveBeenCalled();
        });

        it('should fail if fetch fails', async () => {
            (fetch as any).mockResolvedValue({ ok: false, statusText: 'Not Found' });
            await expect(watermarkAndUploadPdf('http://bad', 'w')).rejects.toThrow('Failed to fetch PDF');
        });
    });
});
