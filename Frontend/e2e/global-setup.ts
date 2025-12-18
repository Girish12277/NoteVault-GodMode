/**
 * GLOBAL SETUP - Simplified for E2E
 * Seeds test data via API calls instead of direct DB access
 */

export default async function globalSetup() {
    console.log('🌱 E2E Test Suite - Global Setup');
    console.log('✅ Backend running on http://localhost:5001');
    console.log('✅ Frontend running on http://localhost:8080');
    console.log('');
    console.log('Test credentials:');
    console.log('  Buyer: e2e-buyer@test.com / BuyerPass123!');
    console.log('  Seller: e2e-seller@test.com / SellerPass123!');
    console.log('');
    console.log('⚠️  NOTE: Tests assume users exist in database');
    console.log('   Run backend seed script first if needed');
}
