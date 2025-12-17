import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

// Helper: Calculate commission based on page count
function calculateCommission(price: number, pages: number): { commission_percentage: number; commission_amount_inr: number; seller_earning_inr: number; } {
    let commissionPct = 15; // Default 15%
    if (pages > 50 && pages <= 150) commissionPct = 12;  // 12% for 50-150 pages
    else if (pages > 150) commissionPct = 10;             // 10% for 150+ pages

    const commissionAmt = (price * commissionPct) / 100;
    return {
        commission_percentage: commissionPct,
        commission_amount_inr: Math.round(commissionAmt),
        seller_earning_inr: Math.round(price - commissionAmt)
    };
}

// Data Arrays for Random Generation
const subjects = [
    'Data Structures', 'Algorithms', 'Thermodynamics', 'Machine Design', 'Organic Chemistry',
    'Quantum Physics', 'Calculus', 'Microeconomics', 'Constitutional Law', 'Anatomy',
    'Circuit Theory', 'Digital Logic', 'Database Management', 'Computer Networks', 'AI & ML',
    'Fluid Mechanics', 'Strength of Materials', 'Marketing Management', 'Financial Accounting', 'Genetics',
    'Psychology', 'Sociology', 'Political Science', 'History of India', 'Macroeconomics',
    'Corporate Law', 'Criminal Law', 'Civil Procedure', 'Biochemistry', 'Microbiology',
    'Software Engineering', 'Operating Systems', 'Cloud Computing', 'Cyber Security', 'Block Chain'
];

const adjectives = [
    'Complete', 'Comprehensive', 'Essential', 'Advanced', 'Simplified',
    'Master', 'Ultimate', 'Concise', 'Detailed', 'Exam-Ready',
    'Topper\'s', 'Quick Revision', 'In-Depth', 'Practical', 'Theory & Labs',
    'Fundamental', 'Basic', 'Core', 'Applied', 'Modern',
    'Classic', 'Visual', 'Interactive', 'Step-by-Step', 'Professional'
];

const noteTypes = [
    'Notes', 'Study Material', 'Guide', 'Handbook', 'Revision Kit',
    'Blueprints', 'Cheat Sheet', 'Exam Solutions', 'Lecture Series', 'Workbook',
    'Lab Manual', 'Project Report', 'Thesis Guide', 'Case Studies', 'Practice Set'
];

const firstNames = [
    'Aarav', 'Vihaan', 'Aditya', 'Arjun', 'Sai', 'Reyansh', 'Ayaan', 'Krishna', 'Ishaan', 'Shaurya',
    'Ananya', 'Diya', 'Saanvi', 'Amaya', 'Kiara', 'Pari', 'Riya', 'Anvi', 'Aadhya', 'Myra',
    'Rahul', 'Priya', 'Amit', 'Neha', 'Rohan', 'Sneha', 'Vikram', 'Pooja', 'Suresh', 'Kavita',
    'Karan', 'Simran', 'Aryan', 'Tanvi', 'Kabir', 'Ishita', 'Dhruv', 'Ria', 'Veer', 'Nisha',
    'Raj', 'Simi', 'Sam', 'Tina', 'Yash', 'Zara', 'Dev', 'Mira', 'Jay', 'Eva'
];

const lastNames = [
    'Sharma', 'Verma', 'Gupta', 'Malhotra', 'Bhatia', 'Saxena', 'Mehta', 'Jain', 'Singh', 'Kaur',
    'Patel', 'Shah', 'Desai', 'Joshi', 'Kulkarni', 'Reddy', 'Nair', 'Menon', 'Pillai', 'Rao',
    'Agarwal', 'Bansal', 'Chopra', 'Das', 'Dutta', 'Ghosh', 'Iyer', 'Kapoor', 'Khanna', 'Kumar',
    'Mishra', 'Mukherjee', 'Pandey', 'Rathore', 'Roy', 'Sethi', 'Sinha', 'Tiwari', 'Yadav', 'Biswas'
];

function getRandomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomElement(arr: string[]) {
    return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
    console.log('🌱 Starting database seed...\\n');

    // 1. Clean existing data (in correct order to avoid FK violations)
    console.log('🧹 Cleaning existing data...');
    // New tables must be cleaned first
    await prisma.notifications.deleteMany();
    await prisma.notification_broadcasts.deleteMany();

    await prisma.reviews.deleteMany();
    await prisma.purchases.deleteMany();
    await prisma.transactions.deleteMany();
    await prisma.notes.deleteMany();
    await prisma.seller_wallets.deleteMany();
    await prisma.categories.deleteMany();
    await prisma.universities.deleteMany();
    await prisma.users.deleteMany();
    console.log('✅ Database cleaned\\n');

    // 2. Create Categories
    console.log('📂 Creating categories...');
    const catData = [
        { id: 'cat_cs', name: 'Computer Science', hi: 'कंप्यूटर विज्ञान', slug: 'computer-science', icon: '💻' },
        { id: 'cat_math', name: 'Mathematics', hi: 'गणित', slug: 'mathematics', icon: '📐' },
        { id: 'cat_phy', name: 'Physics', hi: 'भौतिक विज्ञान', slug: 'physics', icon: '⚛️' },
        { id: 'cat_chem', name: 'Chemistry', hi: 'रसायन विज्ञान', slug: 'chemistry', icon: '🧪' },
        { id: 'cat_elec', name: 'Electronics', hi: 'इलेक्ट्रॉनिक्स', slug: 'electronics', icon: '🔌' },
        { id: 'cat_civil', name: 'Civil Engineering', hi: 'सिविल इंजीनियरिंग', slug: 'civil-engineering', icon: '🏗️' },
        { id: 'cat_mech', name: 'Mechanical', hi: 'मैकेनिकल', slug: 'mechanical', icon: '⚙️' },
        { id: 'cat_bio', name: 'Biology', hi: 'जीव विज्ञान', slug: 'biology', icon: '🧬' }
    ];

    const categories = await Promise.all(catData.map(c =>
        prisma.categories.create({
            data: {
                id: c.id,
                name: c.name,
                name_hi: c.hi,
                slug: c.slug,
                icon: c.icon,
                updated_at: new Date()
            }
        })
    ));
    console.log(`✅ Created ${categories.length} categories\\n`);

    // 3. Create Universities
    console.log('🏛️ Creating universities...');
    const uniData = [
        { id: 'univ_prsu', name: 'Pt. Ravishankar Shukla University', short: 'PRSU', city: 'Raipur', courses: ['BSc', 'MSc', 'BA', 'MA', 'BCom', 'MCom'] },
        { id: 'univ_csvtu', name: 'Chhattisgarh Swami Vivekanand Technical University', short: 'CSVTU', city: 'Bhilai', courses: ['BTech', 'MTech', 'MCA'] },
        { id: 'univ_ggu', name: 'Guru Ghasidas University', short: 'GGU', city: 'Bilaspur', courses: ['BSc', 'MSc', 'BTech', 'MTech', 'PhD'] },
        { id: 'univ_du', name: 'Delhi University', short: 'DU', city: 'New Delhi', courses: ['BA', 'BSc', 'BCom', 'MA', 'MSc'] },
        { id: 'univ_iitb', name: 'IIT Bombay', short: 'IITB', city: 'Mumbai', courses: ['BTech', 'MTech', 'PhD'] }
    ];

    const universities = await Promise.all(uniData.map(u =>
        prisma.universities.create({
            data: {
                id: u.id,
                name: u.name,
                short_name: u.short,
                state: 'India', // Generic for seed
                city: u.city,
                type: 'Government',
                courses_offered: u.courses,
                is_active: true,
                updated_at: new Date()
            }
        })
    ));
    console.log(`✅ Created ${universities.length} universities\\n`);

    // 4. Create Users (200 Total)
    console.log('👥 Creating users...');

    // SECURITY: Use Environment Variable for Admin/Test Passwords
    // Never use hardcoded strings in Production
    const adminPasswordRaw = process.env.ADMIN_PASSWORD || (process.env.NODE_ENV === 'production' ? crypto.randomBytes(16).toString('hex') : 'Test@123');
    const defaultUserPasswordRaw = process.env.USER_DEFAULT_PASSWORD || 'Test@123';

    if (process.env.NODE_ENV === 'production' && !process.env.ADMIN_PASSWORD) {
        console.warn('⚠️ WARNING: AUTO-GENERATING SECURE ADMIN PASSWORD (CHECK LOGS)');
        console.log(`🔑 Generated Admin Password: ${adminPasswordRaw}`);
    }

    const adminPasswordHash = await bcrypt.hash(adminPasswordRaw, 10);
    const userPasswordHash = await bcrypt.hash(defaultUserPasswordRaw, 10);

    // Initial explicit users (3)
    const staticUsers = [
        {
            id: 'user_seller_001',
            email: 'seller@studyvault.com',
            full_name: 'Rahul Sharma',
            degree: 'BTech',
            university_id: universities[1].id,
            is_seller: true,
            role: 'SELLER'
        },
        {
            id: 'user_buyer_001',
            email: 'buyer@studyvault.com',
            full_name: 'Priya Patel',
            degree: 'BSc',
            university_id: universities[0].id,
            is_seller: false,
            role: 'BUYER'
        },
        {
            id: 'user_admin_001',
            email: 'admin@studyvault.com',
            full_name: 'Admin User',
            is_admin: true,
            is_seller: false,
            role: 'ADMIN'
        }
    ];

    for (const u of staticUsers) {
        // Select correct hash based on role
        const pwdHash = u.role === 'ADMIN' ? adminPasswordHash : userPasswordHash;

        await prisma.users.create({
            data: {
                id: u.id,
                email: u.email,
                password_hash: pwdHash,
                full_name: u.full_name,
                degree: u.degree,
                university_id: u.university_id,
                college_name: 'Seed College',
                current_semester: 1,
                current_year: 1,
                preferred_language: 'en',
                is_seller: u.is_seller || false,
                is_admin: u.is_admin || false,
                is_verified: true,
                is_active: true,
                referral_code: u.role + '001',
                updated_at: new Date()
            }
        });
    }

    // Generate 197 random users (mostly sellers/buyers)
    // SKIPPED IN PRODUCTION to prevent clutter
    if (process.env.NODE_ENV === 'production') {
        console.log('Production Environment detected: Skipping random user generation.');
    } else {
        const randomUsers = [];
        for (let i = 0; i < 197; i++) {
            const firstName = getRandomElement(firstNames);
            const lastName = getRandomElement(lastNames);
            const isSeller = Math.random() > 0.5; // 50% chance
            const uni = universities[getRandomInt(0, universities.length - 1)];

            randomUsers.push({
                id: `user_auto_${i}`,
                email: `user${i}@test.com`,
                password_hash: userPasswordHash,
                full_name: `${firstName} ${lastName}`,
                degree: 'BTech',
                university_id: uni.id,
                is_seller: isSeller,
                is_verified: true,
                is_active: true,
                referral_code: `USER${i}${getRandomInt(100, 999)}`,
                updated_at: new Date()
            });
        }

        // Valid createMany
        await prisma.users.createMany({
            data: randomUsers
        });

        console.log(`✅ Created ${staticUsers.length + randomUsers.length} users\\n`);
    }

    // 5. Create Seller Wallets for all sellers
    const allSellers = await prisma.users.findMany({ where: { is_seller: true } });

    await prisma.seller_wallets.createMany({
        data: allSellers.map(s => ({
            id: `wallet_${s.id}`,
            seller_id: s.id,
            available_balance_inr: getRandomInt(0, 5000),
            pending_balance_inr: getRandomInt(0, 1000),
            total_earned_inr: getRandomInt(0, 10000),
            total_withdrawn_inr: 0,
            minimum_withdrawal_amount: 100,
            is_active: true,
            updated_at: new Date()
        }))
    });
    console.log(`✅ Created wallets for ${allSellers.length} sellers\\n`);

    // 6. Generate 500 Notes
    console.log('📝 Generating 500 high-fidelity notes...');
    const notesData = [];

    // Realistic covers (placeholders)
    const covers = [
        'https://placehold.co/600x800/1e293b/FFFFFF/png?text=Notes',
        'https://placehold.co/600x800/ea580c/FFFFFF/png?text=Exam+Prep',
        'https://placehold.co/600x800/0f172a/FFFFFF/png?text=Study+Guide',
        'https://placehold.co/600x800/166534/FFFFFF/png?text=Lab+Manual',
        'https://placehold.co/600x800/7c3aed/FFFFFF/png?text=Formula+Sheet',
        'https://placehold.co/600x800/991b1b/FFFFFF/png?text=Solved+Papers',
        'https://placehold.co/600x800/0891b2/FFFFFF/png?text=Workbook',
        'https://placehold.co/600x800/312e81/FFFFFF/png?text=Lecture+Notes',
        'https://placehold.co/600x800/831843/FFFFFF/png?text=Summary',
        'https://placehold.co/600x800/14532d/FFFFFF/png?text=Handbook'
    ];

    for (let i = 0; i < 500; i++) {
        const subject = getRandomElement(subjects);
        const adjective = getRandomElement(adjectives);
        const type = getRandomElement(noteTypes);
        const title = `${adjective} ${subject} ${type}`;

        const price = getRandomInt(49, 999);
        const pages = getRandomInt(20, 300);
        const { commission_percentage, commission_amount_inr, seller_earning_inr } = calculateCommission(price, pages);

        const category = categories[getRandomInt(0, categories.length - 1)];
        const university = universities[getRandomInt(0, universities.length - 1)];

        // Pick random seller
        const seller = allSellers[getRandomInt(0, allSellers.length - 1)];

        const semester = getRandomInt(1, 8);
        const rating = (Math.random() * (5.0 - 2.5) + 2.5).toFixed(1); // 2.5 to 5.0 rating

        const docType = Math.random() > 0.8 ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 'application/pdf';

        notesData.push({
            id: `note_auto_${1000 + i}`,
            title: title,
            description: `Unlock specific knowledge with this ${type.toLowerCase()} for ${subject}. Designed for ${university.short_name} students in semester ${semester}. \n\nFeatures:\n- Comprehensive coverage of unit 1-5\n- Solved examples and previous year Q&A\n- Easy to understand language (${Math.random() > 0.5 ? 'English' : 'Hindi/English Mix'})\n\nPerfect for securing high marks in exams.`,
            subject: subject,
            degree: 'BTech', // Generic
            specialization: category.name,
            university_id: university.id,
            college_name: 'Institute of Technology',
            semester: semester,
            year: Math.ceil(semester / 2),
            language: Math.random() > 0.7 ? 'hi' : 'en',

            file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
            file_type: docType,
            file_size_bytes: BigInt(getRandomInt(1048576, 10485760)),
            total_pages: pages,

            price_inr: price,
            commission_percentage: commission_percentage,
            commission_amount_inr: commission_amount_inr,
            seller_earning_inr: seller_earning_inr,

            cover_image: covers[getRandomInt(0, covers.length - 1)],
            preview_pages: [
                'https://placehold.co/600x800/png?text=Preview+1',
                'https://placehold.co/600x800/png?text=Preview+2'
            ] as any,
            table_of_contents: 'Introduction\\nModule 1\\nModule 2\\nModule 3\\nConclusion',
            tags: [subject, type, `Sem ${semester}`, university.short_name, category.name],

            seller_id: seller.id,
            category_id: category.id,

            is_approved: true,
            is_active: true,
            is_deleted: false,
            // Randomly flag some for admin testing
            is_flagged: Math.random() < 0.05,

            view_count: getRandomInt(10, 5000),
            download_count: getRandomInt(0, 500),
            purchase_count: getRandomInt(0, 200),
            average_rating: parseFloat(rating),
            total_reviews: getRandomInt(0, 50),
            updated_at: new Date(Date.now() - getRandomInt(0, 5000000000))
        });
    }

    // Batch insert notes
    await prisma.notes.createMany({
        data: notesData as any
    });

    console.log(`✅ Successfully generated ${notesData.length} notes!`);
    console.log('\\n✅ Database seed completed successfully!');
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
