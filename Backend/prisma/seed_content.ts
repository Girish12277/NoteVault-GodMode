import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding Site Content...');

    // 1. Auth Hero Content
    await prisma.siteContent.upsert({
        where: { section: 'auth-hero' },
        update: {},
        create: {
            section: 'auth-hero',
            content: {
                title: "Study Smarter",
                subtitle: "India's largest marketplace for quality academic notes.",
                stats: [
                    { value: "10k+", label: "Notes" },
                    { value: "500+", label: "Universities" },
                    { value: "50k+", label: "Students" },
                    { value: "24h", label: "Refunds" }
                ]
            }
        }
    });

    // 2. Home Hero Content
    await prisma.siteContent.upsert({
        where: { section: 'home-hero' },
        update: {},
        create: {
            section: 'home-hero',
            content: {
                headline: "Your Academic Notes, One Click Away",
                subheadline: "India's largest marketplace for quality academic notes. Find notes from your university, your course, your seniors.",
                stats: [
                    { icon: "BookOpen", value: "10K+", label: "Notes" },
                    { icon: "Users", value: "50K+", label: "Students" },
                    { icon: "Shield", value: "100%", label: "Secure" },
                    { icon: "Sparkles", value: "500+", label: "Universities" }
                ],
                popularSearches: ['Data Structures', 'Engineering Maths', 'Operating Systems', 'DBMS']
            }
        }
    });

    console.log('Site Content Seeded Successfully!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
