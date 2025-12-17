
import axios from 'axios';

const API_URL = 'http://localhost:5001/api';

async function main() {
  try {
    console.log('--- PAYLOAD TEST START ---');
    
    // 1. We need a token? Actually, lets see if we can bypassing auth or use a test token.
    // Wait, verification script needs auth if routes are protected. 
    // noteRoutes.ts likely protects POST /notes.
    // I can login first or use a known token? 
    // Since I can't easily get a token without logging in, I'll assume I need to login.
    
    // Login as a Seller (assuming seed data exists)
    // If not, I'll try to create a user.
    // NOTE: If this is too complex, I can manually check DB after creating.
    
    // Simpler approach: Check if verify_messaging.ts (from user context) has login logic?
    // It's usually easier to just use the existing `api.post` but that's frontend.
    
    // I will try to find a user in DB and generate a token? No, easier to just Login.
    
    // Assuming 'test@example.com' / 'password123' exists or I can create one.
    // Let's try to CREATE a quick user to be safe.
    const uniqueEmail = `seller_${Date.now()}@test.com`;
    const password = 'Password@123';
    
    console.log('1. Registering User:', uniqueEmail);
    const regRes = await axios.post(`${API_URL}/auth/register`, {
        name: 'Test Seller',
        email: uniqueEmail,
        password: password,
        is_seller: true,
        // Optional fields might be needed depending on validation
        degree: 'BTech',
        collegeName: 'Test College',
        currentSemester: 1
    });

    const token = regRes.data.data.accessToken;
    console.log('User registered. Token obtained.');
    
    // 1.5 Become Seller
    console.log('1.5 Becoming Seller...');
    await axios.post(`${API_URL}/auth/become-seller`, {}, {
        headers: { Authorization: `Bearer ${token}` }
    });
    console.log('User promoted to Seller.');
    
    // 2. Create Note with URLs in Body
    console.log('2. Creating Note with previewPages in body...');
    const previewUrls = [
        'https://res.cloudinary.com/demo/image/upload/v1/sample.jpg',
        'https://res.cloudinary.com/demo/image/upload/v1/sample2.jpg'
    ];
    
    const notePayload = {
        title: 'Payload Test Note ' + Date.now(),
        description: 'Testing if previewPages are saved correctly from body.',
        subject: 'Testing',
        degree: 'BTech',
        semester: 1,
        language: 'en',
        fileUrl: 'https://example.com/dummy.pdf',
        fileType: 'application/pdf',
        fileSizeBytes: 1024,
        totalPages: 5,
        priceInr: 100,
        tableOfContents: ['Chapter 1', 'Chapter 2'],
        categoryId: 'some-category-id', // Might need valid ID?
        // THE CRITICAL PART:
        previewPages: previewUrls,
        coverImage: 'https://example.com/cover.jpg'
    };
    
    // We need a valid University ID? Controller says it fallbacks. 
    // We need a valid Category ID? Controller logic: `if (categoryId) where.category_id = categoryId`.
    // In Create: `data: { ... }`. Relations might fail if ID invalid.
    // Let's fetch a category first.
    
    const catRes = await axios.get(`${API_URL}/categories`);
    if (catRes.data.data && catRes.data.data.length > 0) {
        notePayload.categoryId = catRes.data.data[0].id;
    } else {
        console.log('Warning: No categories found, might fail if validation requires it.');
    }
    
    try {
        const createRes = await axios.post(`${API_URL}/notes`, notePayload, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('Note Created! ID:', createRes.data.data.id);
        
        // 3. Verify Response has previewPages
        const createdNote = createRes.data.data;
        console.log('Response Preview Pages:', createdNote.previewPages);
        
        if (Array.isArray(createdNote.previewPages) && createdNote.previewPages.length === 2) {
            console.log('SUCCESS: Preview Pages returned correctly check!');
        } else {
            console.error('FAILURE: Preview Pages missing or incorrect in response.');
        }

    } catch (err: any) {
        console.error('Creation Failed:', err.response?.data || err.message);
    }
    
    console.log('--- PAYLOAD TEST END ---');
  } catch (e: any) {
    console.error('Fatal Error:', e.response?.data || e.message);
  }
}

main();
