import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage, Color } from 'pdf-lib';
import QRCode from 'qrcode';
import crypto from 'crypto';

// ==========================================
// 1. CONFIGURATION (SYSTEM CONSTANTS)
// ==========================================

const SCHEMA_VERSION = '2.0.0'; // Updated to GST-Compliant Schema
const ISSUER_LEGAL_NAME = 'NOTEVAULT TECHNOLOGIES PVT LTD';
const ISSUER_REG_ID = 'CIN: U74999KA2025PTC123456';
const ISSUER_GSTIN = '29AABCT1234H1Z0';
const ISSUER_PAN = 'AABCT1234H';
const ISSUER_ADDRESS = 'Reg. Office: #42, Tech Corridor, Indiranagar, Bangalore - 560038, Karnataka, India.';
const ISSUER_CONTACT = 'compliance@notevault.com';
const JURISDICTION = 'Bangalore, Karnataka';

const COLORS = {
    brand: rgb(0.09, 0.09, 0.11),     // Zinc 950
    accent: rgb(0.97, 0.45, 0.09),    // Brand Orange
    text: {
        primary: rgb(0.1, 0.1, 0.12),    // Zinc 900
        secondary: rgb(0.32, 0.32, 0.35),// Zinc 600
        tertiary: rgb(0.6, 0.6, 0.63),   // Zinc 400
    },
    bg: {
        stripe: rgb(0.98, 0.98, 0.985),  // Zinc 50
        ledger: rgb(0.99, 0.96, 0.94)    // Orange 50
    },
    border: rgb(0.9, 0.9, 0.92),
    status: {
        paid: rgb(0.1, 0.6, 0.3),     // Emerald
    }
};

const LAYOUT = {
    width: 595.28,
    height: 841.89,
    margin: 40, // Adjusted for more content
    contentTop: 841.89 - 140,
    contentBottom: 120
};

// ==========================================
// 2. HELPER PRIMITIVES
// ==========================================

const drawText = (page: PDFPage, text: string, x: number, y: number, font: PDFFont, size: number, color: Color, options: any = {}) => {
    page.drawText(text, { x, y, font, size, color, ...options });
};

const drawLine = (page: PDFPage, start: { x: number, y: number }, end: { x: number, y: number }, color: Color = COLORS.border, thickness: number = 0.5) => {
    page.drawLine({ start, end, thickness, color });
};

// ==========================================
// 3. ARCHITECTURE COMPONENTS (STRICT COMPLIANCE)
// ==========================================

/**
 * <PersistentHeader />
 */
const drawPersistentHeader = (page: PDFPage, fonts: any, invoiceId: string) => {
    const { margin, width } = LAYOUT;
    const topY = LAYOUT.height - margin;

    // Brand Logo Area
    page.drawRectangle({
        x: margin, y: topY - 45, width: 45, height: 45,
        color: COLORS.brand
    });
    drawText(page, 'NV', margin + 7, topY - 35, fonts.bold, 24, rgb(1, 1, 1));
    drawText(page, 'NoteVault', margin + 60, topY - 20, fonts.bold, 22, COLORS.brand);
    drawText(page, 'Technologies Pvt Ltd', margin + 60, topY - 32, fonts.regular, 9, COLORS.text.secondary);

    // Tax Invoice Classification
    const title = 'TAX INVOICE';
    const titleW = fonts.bold.widthOfTextAtSize(title, 16);
    drawText(page, title, width - margin - titleW, topY - 20, fonts.bold, 16, COLORS.text.secondary, { letterSpacing: 1.5 });

    // GSTIN Display
    const gstStr = `GSTIN: ${ISSUER_GSTIN}`;
    drawText(page, gstStr, width - margin - fonts.mono.widthOfTextAtSize(gstStr, 9), topY - 35, fonts.mono, 9, COLORS.text.primary);

    // Invoice ID
    const metaY = topY - 50;
    drawText(page, `Ref: ${invoiceId}`, width - margin - fonts.mono.widthOfTextAtSize(`Ref: ${invoiceId}`, 9), metaY, fonts.mono, 9, COLORS.text.primary);
};

/**
 * <PersistentFooter />
 */
const drawPersistentFooter = (page: PDFPage, fonts: any, pageNum: number, totalPages: number | string) => {
    const { margin, width } = LAYOUT;
    const y = 50;

    drawLine(page, { x: margin, y: y + 25 }, { x: width - margin, y: y + 25 });

    // Corporate Identity (Legal Requirement)
    drawText(page, ISSUER_LEGAL_NAME, margin, y + 10, fonts.bold, 8, COLORS.brand);
    drawText(page, ISSUER_ADDRESS, margin, y, fonts.regular, 7, COLORS.text.secondary);
    drawText(page, `${ISSUER_REG_ID} | PAN: ${ISSUER_PAN} | Contact: ${ISSUER_CONTACT}`, margin, y - 10, fonts.mono, 7, COLORS.text.secondary);

    // Pagination
    const pageStr = `Page ${pageNum} of ${totalPages}`;
    drawText(page, pageStr, width - margin - fonts.regular.widthOfTextAtSize(pageStr, 8), y + 10, fonts.regular, 8, COLORS.text.primary);
};

/**
 * <BillingParty />
 */
const drawBillingParty = (page: PDFPage, fonts: any, y: number, data: any) => {
    const { margin } = LAYOUT;
    const innerY = y - 10;

    drawText(page, 'BILLED TO (CONSUMER)', margin, innerY, fonts.bold, 8, COLORS.text.tertiary);
    drawText(page, data.customerName || 'Valued Customer', margin, innerY - 15, fonts.bold, 11, COLORS.text.primary);

    // Address Fallback (B2C)
    const buyerAddress = data.customerAddress || 'Address not on file (B2C Supply)';
    drawText(page, buyerAddress, margin, innerY - 28, fonts.regular, 9, COLORS.text.secondary);
    drawText(page, `Email: ${data.customerEmail || 'N/A'}`, margin, innerY - 40, fonts.regular, 9, COLORS.text.secondary);

    // Payment Reference
    const rightX = LAYOUT.width / 2 + 20;
    drawText(page, 'PAYMENT & ORDER DETAILS', rightX, innerY, fonts.bold, 8, COLORS.text.tertiary);
    drawText(page, `Order ID: ${data.paymentId}`, rightX, innerY - 15, fonts.mono, 9, COLORS.text.primary);
    drawText(page, `Date: ${new Date().toLocaleDateString('en-IN')}`, rightX, innerY - 28, fonts.regular, 9, COLORS.text.primary);
    drawText(page, `Place of Supply: Karnataka (State Code: 29)`, rightX, innerY - 40, fonts.regular, 9, COLORS.text.secondary);

    return y - 70;
};

/**
 * <LineItemTable />
 */
const drawTableHeader = (page: PDFPage, fonts: any, y: number) => {
    const { margin, width } = LAYOUT;
    page.drawRectangle({
        x: margin, y: y - 24, width: width - (margin * 2), height: 24, color: COLORS.brand
    });
    const hY = y - 16;

    // COMPLIANT COLUMNS
    drawText(page, 'SAC/HSN', margin + 10, hY, fonts.bold, 8, rgb(1, 1, 1));
    drawText(page, 'DESCRIPTION', margin + 60, hY, fonts.bold, 8, rgb(1, 1, 1));
    drawText(page, 'BASE', width - margin - 140, hY, fonts.bold, 8, rgb(1, 1, 1));
    drawText(page, 'GST (18%)', width - margin - 80, hY, fonts.bold, 8, rgb(1, 1, 1));
    drawText(page, 'TOTAL', width - margin - 30, hY, fonts.bold, 8, rgb(1, 1, 1));

    return y - 24;
};

/**
 * <FinancialLedger />
 */
const drawFinancialLedger = (page: PDFPage, fonts: any, y: number, totalVal: string, baseVal: string, taxVal: string) => {
    const { margin, width } = LAYOUT;
    const startX = width - margin - 250;

    // Header
    drawText(page, 'TAX SUMMARY (INR)', startX, y, fonts.bold, 9, COLORS.text.tertiary);
    y -= 15;

    // 1. Taxable Value
    drawText(page, 'Taxable Value', startX, y, fonts.regular, 9, COLORS.text.secondary);
    drawText(page, baseVal, width - margin - fonts.mono.widthOfTextAtSize(baseVal, 9), y, fonts.mono, 9, COLORS.text.primary);
    y -= 15;

    // 2. IGST/SGST/CGST (Simplified as GST for B2C Intra/Inter logic placeholder)
    drawText(page, 'IGST / CGST+SGST (18%)', startX, y, fonts.regular, 9, COLORS.text.secondary);
    drawText(page, taxVal, width - margin - fonts.mono.widthOfTextAtSize(taxVal, 9), y, fonts.mono, 9, COLORS.text.primary);
    y -= 15;

    // 3. Grand Total
    page.drawRectangle({
        x: startX - 5, y: y - 10, width: 250, height: 20, color: COLORS.bg.ledger
    });
    drawText(page, 'Invoice Total (Inclusive)', startX, y - 5, fonts.bold, 10, COLORS.brand);
    drawText(page, `INR ${totalVal}`, width - margin - fonts.mono.widthOfTextAtSize(`INR ${totalVal}`, 10) - 2, y - 5, fonts.bold, 10, COLORS.brand);

    return y - 40;
};

/**
 * <VerificationBlock /> (Honest Terminology)
 */
const drawVerificationBlock = async (doc: any, page: PDFPage, fonts: any, y: number, hash: string, verifyUrl: string) => {
    const { margin } = LAYOUT;

    const qrBuffer = await QRCode.toBuffer(verifyUrl, { errorCorrectionLevel: 'M' });
    const qrImage = await doc.embedPng(qrBuffer);

    page.drawImage(qrImage, { x: margin, y: y - 50, width: 50, height: 50 });

    const tX = margin + 60;
    // CRITICAL FIX: Honest Terminology from Audit
    drawText(page, 'DATA INTEGRITY SEAL', tX, y, fonts.bold, 8, COLORS.brand);
    drawText(page, 'Algorithm: SHA-256 (Canonical Payload Hash)', tX, y - 10, fonts.mono, 7, COLORS.text.secondary);
    drawText(page, `Hash: ${hash}`, tX, y - 20, fonts.mono, 6, COLORS.text.secondary);
    drawText(page, 'Note: This represents a cryptographic integrity check, not a DSC under IT Act 2000.', tX, y - 30, fonts.regular, 6, COLORS.text.tertiary);
};

// ==========================================
// 4. MAIN SERVICE (ORCHESTRATOR)
// ==========================================

export const invoiceService = {
    generateInvoice: async (orderData: any): Promise<{ pdf: Buffer; invoiceId: string; hash: string }> => {
        try {
            const doc = await PDFDocument.create();
            const fonts = {
                regular: await doc.embedFont(StandardFonts.Helvetica),
                bold: await doc.embedFont(StandardFonts.HelveticaBold),
                mono: await doc.embedFont(StandardFonts.Courier)
            };

            // --- ID LOGIC ---
            const isoDate = new Date().toISOString();
            const entropy = crypto.randomBytes(3).toString('hex').toUpperCase();
            const simpleDate = isoDate.split('T')[0];
            const invoiceId = `NV-IN-${simpleDate}-${entropy}`;

            // --- FINANCIAL MATH (GST BACK-CALCULATION) ---
            const grandTotal = Number(orderData.totalAmount);
            const baseAmount = grandTotal / 1.18; // 18% GST Logic
            const taxAmount = grandTotal - baseAmount;

            const totalStr = grandTotal.toFixed(2);
            const baseStr = baseAmount.toFixed(2);
            const taxStr = taxAmount.toFixed(2);

            // --- PAYLOAD & HASH ---
            const payload = `v2.0|${invoiceId}|${simpleDate}|${totalStr}|INR`;
            const hash = crypto.createHash('sha256').update(payload).digest('hex').toUpperCase();

            // Environment Aware URL
            const baseUrl = process.env.FRONTEND_URL || 'https://notevault.com';
            const verifyUrl = `${baseUrl}/verify/${invoiceId}?sig=${hash.substring(0, 12)}`;

            let pageCount = 0;
            const pages: PDFPage[] = [];

            const addPage = () => {
                const p = doc.addPage([LAYOUT.width, LAYOUT.height]);
                pageCount++;
                pages.push(p);
                return p;
            };

            let page = addPage();
            let currentY = LAYOUT.contentTop;

            // 1. Party
            currentY = drawBillingParty(page, fonts, currentY, orderData);

            // 2. Items
            currentY = drawTableHeader(page, fonts, currentY);
            currentY -= 10;

            const items = orderData.items;
            for (let i = 0; i < items.length; i++) {
                if (currentY < (LAYOUT.contentBottom + 40)) {
                    page = addPage();
                    currentY = LAYOUT.contentTop;
                    currentY = drawTableHeader(page, fonts, currentY);
                    currentY -= 10;
                }

                if (i % 2 === 0) page.drawRectangle({ x: LAYOUT.margin, y: currentY - 25, width: LAYOUT.width - LAYOUT.margin * 2, height: 30, color: COLORS.bg.stripe });

                const item = items[i];
                const itemTotal = Number(item.price);
                const itemBase = (itemTotal / 1.18).toFixed(2);
                const itemTax = (itemTotal - Number(itemBase)).toFixed(2);

                drawText(page, '9963', LAYOUT.margin + 10, currentY - 18, fonts.mono, 9, COLORS.text.secondary); // HSN for Library/Digital

                // Truncate title manually to avoid overflow
                const safeTitle = item.title.length > 45 ? item.title.substring(0, 42) + '...' : item.title;
                drawText(page, safeTitle, LAYOUT.margin + 60, currentY - 18, fonts.regular, 9, COLORS.text.primary);

                // Financial Cols
                drawText(page, itemBase, LAYOUT.width - LAYOUT.margin - 140, currentY - 18, fonts.mono, 9, COLORS.text.secondary);
                drawText(page, itemTax, LAYOUT.width - LAYOUT.margin - 80, currentY - 18, fonts.mono, 9, COLORS.text.secondary);
                drawText(page, itemTotal.toFixed(2), LAYOUT.width - LAYOUT.margin - 30 - fonts.mono.widthOfTextAtSize(itemTotal.toFixed(2), 9), currentY - 18, fonts.mono, 9, COLORS.brand);

                currentY -= 30;
            }

            // 3. Summary & Footer Rules
            if (currentY < (LAYOUT.contentBottom + 200)) {
                page = addPage();
                currentY = LAYOUT.contentTop;
            }

            drawLine(page, { x: LAYOUT.margin, y: currentY }, { x: LAYOUT.width - LAYOUT.margin, y: currentY });
            currentY -= 20;

            currentY = drawFinancialLedger(page, fonts, currentY, totalStr, baseStr, taxStr);

            await drawVerificationBlock(doc, page, fonts, currentY, hash, verifyUrl);

            // LEGAL TERMS
            const legY = currentY - 70;
            drawText(page, 'TERMS & CONDITIONS', LAYOUT.margin, legY, fonts.bold, 8, COLORS.brand);
            drawText(page, '1. Digital Goods are strictly non-refundable once accessed/downloaded.', LAYOUT.margin, legY - 12, fonts.regular, 7, COLORS.text.secondary);
            drawText(page, '2. All disputes subject to exclusive jurisdiction of Bangalore Courts.', LAYOUT.margin, legY - 22, fonts.regular, 7, COLORS.text.secondary);
            drawText(page, '3. For support/grievances: support@notevault.com', LAYOUT.margin, legY - 32, fonts.regular, 7, COLORS.text.secondary);
            drawText(page, '*** AUTHORIZED COMPUTER GENERATED INVOICE ***', LAYOUT.width / 2 - 80, legY - 50, fonts.mono, 7, COLORS.text.tertiary);

            // FINAL PASS
            const totalPages = pages.length;
            pages.forEach((p, idx) => {
                drawPersistentHeader(p, fonts, invoiceId);
                drawPersistentFooter(p, fonts, idx + 1, totalPages);
            });

            const pdfBytes = await doc.save();
            return {
                pdf: Buffer.from(pdfBytes),
                invoiceId,
                hash
            };
        } catch (error) {
            console.error('Invoice Generation Failed', error);
            throw error;
        }
    }
};
