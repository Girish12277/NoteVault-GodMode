import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { invoiceService } from '../../../src/services/invoiceService';

// Mock dependencies
const mockDrawText = jest.fn();
const mockDrawRectangle = jest.fn();
const mockDrawLine = jest.fn();
const mockDrawImage = jest.fn();
const mockSave = jest.fn<() => Promise<Buffer>>().mockResolvedValue(Buffer.from('PDF_CONTENT'));
const mockEmbedFont = jest.fn<() => Promise<any>>().mockResolvedValue({
    widthOfTextAtSize: jest.fn().mockReturnValue(10) // Always return width 10
});
const mockEmbedPng = jest.fn<() => Promise<any>>().mockResolvedValue('MOCK_IMAGE');
const mockAddPage = jest.fn().mockReturnValue({
    drawText: mockDrawText,
    drawRectangle: mockDrawRectangle,
    drawLine: mockDrawLine,
    drawImage: mockDrawImage
});

jest.mock('pdf-lib', () => {
    return {
        PDFDocument: {
            create: jest.fn(() => ({
                embedFont: mockEmbedFont,
                embedPng: mockEmbedPng,
                addPage: mockAddPage,
                save: mockSave
            }))
        },
        StandardFonts: {
            Helvetica: 'Helvetica',
            HelveticaBold: 'HelveticaBold',
            Courier: 'Courier'
        },
        rgb: jest.fn((r, g, b) => ({ r, g, b })),
    };
});

jest.mock('qrcode', () => ({
    toBuffer: jest.fn<() => Promise<Buffer>>().mockResolvedValue(Buffer.from('QR_CODE'))
}));

describe('Invoice Service Brutal Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const mockOrderData = {
        totalAmount: 1180, // 1000 + 180 GST
        items: [
            { title: 'Note 1', price: 590 },
            { title: 'Note 2', price: 590 }
        ],
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        customerAddress: '123 Fake St',
        paymentId: 'pay_123'
    };

    it('should generate a PDF invoice successfully', async () => {
        const result = await invoiceService.generateInvoice(mockOrderData);

        expect(result.pdf).toBeInstanceOf(Buffer);
        expect(result.invoiceId).toMatch(/^NV-IN-\d{4}-\d{2}-\d{2}-[A-F0-9]+$/);
        expect(result.hash).toBeDefined();

        // Verify PDF interactions
        expect(mockEmbedFont).toHaveBeenCalledTimes(3); // Regular, Bold, Mono
        expect(mockEmbedPng).toHaveBeenCalledTimes(1); // QRCode
        expect(mockAddPage).toHaveBeenCalled();
        expect(mockDrawText).toHaveBeenCalled();
        expect(mockSave).toHaveBeenCalled();
    });

    it('should handle pagination for many items', async () => {
        const manyItems = Array(50).fill({ title: 'Item', price: 100 });
        const data = { ...mockOrderData, items: manyItems };

        await invoiceService.generateInvoice(data);

        // Expect multiple pages added
        expect(mockAddPage.mock.calls.length).toBeGreaterThan(1);
    });

    it('should calculate tax correctly (verification by side-effect)', async () => {
        // We can check if specific text was drawn. 
        // 1180 Total -> 1000 Base -> 180 Tax
        await invoiceService.generateInvoice(mockOrderData);

        // Check if "1000.00" and "180.00" were drawn
        const baseCalls = mockDrawText.mock.calls.some(args => args[0] === '1000.00');
        const taxCalls = mockDrawText.mock.calls.some(args => args[0] === '180.00');

        expect(baseCalls).toBe(true);
        expect(taxCalls).toBe(true);
    });

    it('should truncate long item titles', async () => {
        const longTitle = 'This is a very very very long title that should be truncated because it is too long for the invoice line item';
        const data = { ...mockOrderData, items: [{ title: longTitle, price: 100 }] };

        await invoiceService.generateInvoice(data);

        // Expect truncated title to be drawn
        const truncated = longTitle.substring(0, 42) + '...';
        const wasDrawn = mockDrawText.mock.calls.some(args => args[0] === truncated);
        expect(wasDrawn).toBe(true);
    });

    it('should handle errors gracefully', async () => {
        mockSave.mockRejectedValueOnce(new Error('PDF Generation Error'));

        await expect(invoiceService.generateInvoice(mockOrderData))
            .rejects.toThrow('PDF Generation Error');
    });
});
