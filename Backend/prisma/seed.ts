import { PrismaClient, CouponType, CouponScope } from '@prisma/client';
import crypto from 'crypto';
import * as bcrypt from 'bcryptjs';

// Initialize Prisma Client
const prisma = new PrismaClient();

// --- Configuration ---
// Generate real hash using bcryptjs (same as authController)
const COMMON_PASSWORD = 'admin';
// We use 12 rounds as per authController
const SALT_ROUNDS = 12;

async function main() {
    console.log('🌱 Start God-Level Seeding Protocol...');

    // Pre-calculate hash
    console.log('🔹 Generating Security Hashes...');
    const COMMON_HASH = await bcrypt.hash(COMMON_PASSWORD, SALT_ROUNDS);
    console.log('   -> Hash Generated for password "admin"');

    // =================================================================
    // 1. SITE CONTENT
    // =================================================================
    console.log('🔹 Seeding Site Content...');
    await prisma.siteContent.upsert({
        where: { section: 'auth-hero' },
        update: {},
        create: {
            section: 'auth-hero',
            content: {
                title: "Study Smarter",
                subtitle: "India's largest marketplace for quality academic notes.",
                stats: [{ value: "10k+", label: "Notes" }, { value: "500+", label: "Universities" }, { value: "50k+", label: "Students" }, { value: "24h", label: "Refunds" }]
            }
        }
    });

    await prisma.siteContent.upsert({
        where: { section: 'home-hero' },
        update: {},
        create: {
            section: 'home-hero',
            content: {
                headline: "Your Academic Notes, One Click Away",
                subheadline: "India's largest marketplace for quality academic notes.",
                stats: [
                    { icon: "BookOpen", value: "10K+", label: "Notes" },
                    { icon: "Users", value: "50K+", label: "Students" },
                    { icon: "Shield", value: "100%", label: "Secure" },
                    { icon: "Sparkles", value: "500+", label: "Universities" }
                ],
                popularSearches: ['Data Structures', 'Engineering Maths', 'DSA', 'React']
            }
        }
    });

    // =================================================================
    // 2. MASS USERS (Admins, Sellers, Buyers)
    // =================================================================
    console.log('🔹 Seeding Mass Users...');

    const usersToCreate = [
        // --- ADMINS ---
        { email: 'admin@studyvault.com', name: 'System Admin', role: 'ADMIN' },
        { email: 'superadmin@studyvault.com', name: 'Super Admin', role: 'ADMIN' },

        // --- SELLERS ---
        { email: 'seller1@studyvault.com', name: 'Alice Author', role: 'SELLER' },
        { email: 'seller2@studyvault.com', name: 'Bob Books', role: 'SELLER' },
        { email: 'seller3@studyvault.com', name: 'Charlie Creator', role: 'SELLER' },
        { email: 'notes.topper@gmail.com', name: 'Topper Notes', role: 'SELLER' },
        { email: 'professor.x@university.edu', name: 'Professor X', role: 'SELLER' },

        // --- BUYERS ---
        { email: 'buyer1@studyvault.com', name: 'Dave Downloader', role: 'BUYER' },
        { email: 'buyer2@studyvault.com', name: 'Eve Exam', role: 'BUYER' },
        { email: 'student.one@college.edu', name: 'Student One', role: 'BUYER' },
        { email: 'exam.warrior@gmail.com', name: 'Exam Warrior', role: 'BUYER' },
        { email: 'lastminute@study.com', name: 'Last Minute', role: 'BUYER' },
    ];

    const createdUsers: any[] = [];

    for (const u of usersToCreate) {
        const isAdmin = u.role === 'ADMIN';
        const isSeller = u.role === 'SELLER' || isAdmin; // Admins are sellers too for testing

        const user = await prisma.users.upsert({
            where: { email: u.email },
            update: {
                is_admin: isAdmin,
                is_seller: isSeller,
                password_hash: COMMON_HASH, // FORCE UPDATE PASSWORD
                failed_login_attempts: 0,   // RESET LOCKOUT
                lockout_until: null         // RESET LOCKOUT
            },
            create: {
                id: crypto.randomUUID(),
                email: u.email,
                full_name: u.name,
                password_hash: COMMON_HASH,
                is_admin: isAdmin,
                is_seller: isSeller,
                is_verified: true,
                is_active: true,
                referral_code: `REF${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
                updated_at: new Date()
            }
        });
        createdUsers.push(user);

        // Setup Seller Wallet if seller
        if (isSeller) {
            await prisma.seller_wallets.upsert({
                where: { seller_id: user.id },
                update: {},
                create: {
                    id: crypto.randomUUID(),
                    seller_id: user.id,
                    updated_at: new Date(),
                    available_balance_inr: 0,
                    is_active: true
                }
            });
        }
    }
    console.log(`   -> Seeded ${createdUsers.length} Users.`);


    // =================================================================
    // 3. CATEGORIES & NOTES (Mass Seeding)
    // =================================================================
    console.log('🔹 Seeding Categories & Mass Notes...');

    // Expanded Categories
    const categoryData = [
        { name: 'Computer Science', slug: 'cs', icon: '💻' },
        { name: 'Electronics', slug: 'ece', icon: '⚡' },
        { name: 'Mechanical', slug: 'mech', icon: '⚙️' },
        { name: 'Civil Engineering', slug: 'civil', icon: '🏗️' },
        { name: 'Business & MBA', slug: 'business', icon: '💼' },
        { name: 'Medical & Biology', slug: 'medical', icon: '🧬' },
        { name: 'Arts & Humanities', slug: 'arts', icon: '🎨' },
        { name: 'Mathematics', slug: 'math', icon: '📐' },
        { name: 'Physics', slug: 'physics', icon: '⚛️' },
        { name: 'Chemistry', slug: 'chem', icon: '🧪' },
        { name: 'Law', slug: 'law', icon: '⚖️' },
        { name: 'Architecture', slug: 'arch', icon: '🏛️' }
    ];

    const allCatIds: string[] = [];

    for (const c of categoryData) {
        const cat = await prisma.categories.upsert({
            where: { slug: c.slug },
            update: {},
            create: {
                id: crypto.randomUUID(),
                name: c.name,
                name_hi: c.name,
                slug: c.slug,
                icon: c.icon,
                updated_at: new Date()
            }
        });
        allCatIds.push(cat.id);
    }
    const csCatId = allCatIds[0]; // Keep ref for coupons

    // University
    const uni = await prisma.universities.upsert({
        where: { name: 'Tech University' },
        update: {},
        create: {
            id: crypto.randomUUID(),
            name: 'Tech University',
            short_name: 'TU',
            state: 'Delhi',
            city: 'New Delhi',
            type: 'Public',
            updated_at: new Date()
        }
    });

    // Mass Note Generation Helpers
    const adjectives = ['Complete', 'Advanced', 'Essential', 'Mastering', 'Introduction to', 'The Ultimate', 'Concise', 'Detailed', 'Expert', 'Fundamental'];
    const subjects = [
        'Data Structures', 'Algorithms', 'Operating Systems', 'DBMS', 'Computer Networks', // CS
        'Circuit Theory', 'Digital Logic', 'Microprocessors', 'Signal Processing', // ECE
        'Thermodynamics', 'Fluid Mechanics', 'Strength of Materials', 'Kinematics', // MECH
        'Marketing Management', 'Financial Accounting', 'Human Resources', 'Supply Chain', // MBA
        'Anatomy', 'Physiology', 'Biochemistry', 'Pathology', 'Pharmacology', // MED
        'Linear Algebra', 'Calculus', 'Statistics', 'Discrete Math', // MATH
        'Constitutional Law', 'Criminal Law', 'Contract Law', 'Torts' // LAW
    ];
    const degrees = ['B.Tech', 'M.Tech', 'BBA', 'MBA', 'MBBS', 'B.Sc', 'M.Sc', 'LLB', 'B.Arch'];
    const languages = ['en', 'hi', 'both'];

    // Collect Seller IDs
    // Collect Seller IDs
    const sellers = await prisma.users.findMany({ where: { is_seller: true } });
    const sellerIds = sellers.map(s => s.id);

    // Retrieve specific sellers for coupon scoping
    const seller1 = sellers.find(s => s.email === 'seller1@studyvault.com') || sellers[0];

    console.log(`   -> Generating 750 Notes across ${categoryData.length} categories...`);

    const notesToCreate: any[] = [];

    for (let i = 0; i < 750; i++) {
        // Random Selection
        const sellerId = sellerIds[i % sellerIds.length];
        const catId = allCatIds[i % allCatIds.length];
        const subject = subjects[i % subjects.length];
        const adj = adjectives[i % adjectives.length];
        const title = `${adj} ${subject} Notes - Vol ${Math.floor(i / 20) + 1}`;
        // Price: Random between 250 and 2500 INR
        const price = 250 + Math.floor(Math.random() * 2250);

        // Deterministic ID for idempotency
        const noteId = `note_mass_seed_${i + 1}`;

        notesToCreate.push({
            id: noteId,
            title: title,
            description: `Comprehensive ${title} covering all key concepts. Ideal for exam preparation. Includes solved examples, diagrams, and previous year questions. Verified by top professors.`,
            subject: subject,
            degree: degrees[i % degrees.length],
            university_id: uni.id,
            semester: (i % 8) + 1,
            file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', // Reliable dummy PDF
            file_type: 'pdf',
            file_size_bytes: BigInt(1024 * 1024 * (Math.floor(Math.random() * 10) + 1)), // 1-10MB
            total_pages: 50 + Math.floor(Math.random() * 200),
            price_inr: price,
            commission_percentage: 10,
            commission_amount_inr: Math.round(price * 0.1),
            seller_earning_inr: Math.round(price * 0.9),
            seller_id: sellerId,
            category_id: catId,
            cover_image: `https://picsum.photos/seed/${noteId}/400/600`, // Unique image per note
            is_active: true,
            is_approved: true,
            language: languages[i % languages.length],
            updated_at: new Date()
        });
    }

    // Insert in batches
    console.log('   -> Inserting Batch 1/5...');
    for (const n of notesToCreate) {
        await prisma.notes.upsert({
            where: { id: n.id },
            update: {}, // Don't overwrite if exists (preserves edits), or use values to reset? Let's keep existing.
            create: n
        });
    }

    const totalPrice = notesToCreate.reduce((sum, n) => sum + n.price_inr, 0);
    console.log(`   -> ✅ Successfully seeded 500 notes.`);
    console.log(`   -> 💰 Total Value of Inventory: ₹${totalPrice.toLocaleString('en-IN')}`);



    // =================================================================
    // 4. MASS COUPONS
    // =================================================================
    console.log('🔹 Seeding Diverse Coupons...');

    const coupons = [
        // 1. GLOBAL FLAT
        {
            code: 'WELCOME50',
            type: CouponType.FLAT,
            value: 50,
            min: 150,
            desc: 'Flat ₹50 off on orders > ₹150'
        },
        // 2. GLOBAL PERCENTAGE
        {
            code: 'SAVE20',
            type: CouponType.PERCENTAGE,
            value: 20,
            min: 0,
            max_disc: 200,
            desc: '20% off up to ₹200'
        },
        // 3. HIGH VALUE (Big Spender)
        {
            code: 'BIGSPENDER',
            type: CouponType.PERCENTAGE,
            value: 30,
            min: 1000,
            max_disc: 500,
            desc: '30% off for orders over ₹1000'
        },
        // 4. LOW USAGE LIMIT
        {
            code: 'FLASH5',
            type: CouponType.FLAT,
            value: 100,
            min: 200,
            limit: 5,
            desc: 'First 5 users get ₹100 off'
        },
        // 5. EXPIRED COUPON
        {
            code: 'EXPIRED2024',
            type: CouponType.FLAT,
            value: 500,
            expiry: new Date('2024-01-01'),
            desc: 'Expired last year'
        },
        // 6. CATEGORY SPECIFIC (CS Only)
        {
            code: 'CSLOVER',
            type: CouponType.PERCENTAGE,
            value: 25,
            scope: CouponScope.CATEGORY,
            scope_ids: csCatId ? [csCatId] : [],
            desc: '25% off on Computer Science notes'
        },
        // 7. SELLER SPECIFIC (Seller 1 Only)
        {
            code: 'ALICEFAN',
            type: CouponType.FLAT,
            value: 50,
            scope: CouponScope.SELLER,
            scope_ids: seller1 ? [seller1.id] : [],
            desc: '₹50 off on Alice Author notes'
        }
    ];

    for (const c of coupons) {
        await prisma.coupons.upsert({
            where: { code: c.code },
            update: {
                scope: c.scope || CouponScope.GLOBAL,
                scope_ids: c.scope_ids || [],
                description: c.desc,
                value: c.value
            },
            create: {
                code: c.code,
                description: c.desc,
                type: c.type,
                value: c.value,
                min_order_value: c.min || 0,
                max_discount_amount: c.max_disc || null,
                start_date: new Date(),
                end_date: c.expiry || new Date('2030-12-31'),
                usage_limit_global: c.limit || 1000,
                usage_limit_per_user: 1,
                is_active: true,
                scope: c.scope || CouponScope.GLOBAL,
                scope_ids: c.scope_ids || []
            }
        });
    }
    console.log(`   -> Seeded ${coupons.length} Coupons.`);

    console.log('\n✅ God-Level Seeding Protocol Complete.');
    console.log('=========================================');
    console.log('       🔐 CREDENTIALS VAULT 🔐       ');
    console.log('=========================================');
    console.log('PASSWORD FOR ALL USERS: "admin"');
    console.log('-----------------------------------------');
    console.log('ADMINS:');
    console.log(' - admin@studyvault.com');
    console.log(' - superadmin@studyvault.com');
    console.log('-----------------------------------------');
    console.log('SELLERS (With Wallets):');
    console.log(' - seller1@studyvault.com (Has Note: "CS Guide")');
    console.log(' - seller2@studyvault.com');
    console.log(' - notes.topper@gmail.com');
    console.log('-----------------------------------------');
    console.log('BUYERS:');
    console.log(' - buyer1@studyvault.com');
    console.log(' - exam.warrior@gmail.com');
    console.log('=========================================');
    console.log('COUPONS:');
    usersToCreate.forEach(() => { }); // No-op to avoid unused var if needed
    coupons.forEach(c => console.log(` - ${c.code}: ${c.desc}`));
    console.log('=========================================');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
