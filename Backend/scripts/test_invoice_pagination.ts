
import { invoiceService } from '../src/services/invoiceService';
import fs from 'fs';
import path from 'path';

// Mock Data with 40 Items to force overflow
const mockOrder = {
    orderId: 'ORDER-PAGINATION-TEST-001',
    paymentId: 'pay_PaginationTest999',
    totalAmount: 19999.00,
    customerName: 'Pagination Tester',
    customerEmail: 'test@overflow.com',
    paymentMethod: 'Credit Card',
    items: Array.from({ length: 100 }, (_, i) => ({
        title: `Stress Test Item ${i + 1} - Checking Page Breaks and Header Persistence`,
        price: 99.00
    }))
};

async function run() {
    console.log('🚀 Starting V5 Adversarial Stress Test (100 Items)...');
    try {
        const pdfBuffer = await invoiceService.generateInvoice(mockOrder);
        const outputPath = path.join(__dirname, '../invoice_pagination_test.pdf');
        fs.writeFileSync(outputPath, pdfBuffer);
        console.log(`✅ PDF Generated: ${outputPath}`);
        console.log('👉 Open this file to verify multi-page layout and footer positioning.');
    } catch (error) {
        console.error('❌ Generation Failed:', error);
    }
}

run();
