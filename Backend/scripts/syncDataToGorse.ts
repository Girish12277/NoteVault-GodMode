/**
 * DATA SYNC SCRIPT FOR GORSE RECOMMENDATION ENGINE
 * 
 * Syncs existing users, notes, and purchases to Gorse
 * Run once after Phase 2 deployment
 * 
 * Usage: ts-node scripts/syncDataToGorse.ts
 */

import { prisma } from '../src/config/database';
import { gorseService } from '../src/services/gorseRecommendationService';
import dotenv from 'dotenv';

dotenv.config();

const prismaAny = prisma as any;

async function syncUsers() {
    console.log('📊 Syncing users to Gorse...');

    const users = await prismaAny.users.findMany({
        where: { is_deleted: false },
        select: {
            id: true,
            degree: true,
            university_id: true,
            current_semester: true,
            universities: {
                select: { name: true }
            }
        }
    });

    let synced = 0;
    for (const user of users) {
        try {
            const labels = [];

            if (user.degree) labels.push(user.degree);
            if (user.universities?.name) labels.push(user.universities.name);
            if (user.current_semester) labels.push(`semester-${user.current_semester}`);

            await gorseService.upsertUser(
                user.id,
                labels,
                [user.degree].filter(Boolean)  // Subscribe to own degree
            );

            synced++;
            if (synced % 100 === 0) {
                console.log(`  ✓ Synced ${synced}/${users.length} users`);
            }
        } catch (error) {
            console.error(`  ✗ Failed to sync user ${user.id}:`, error);
        }
    }

    console.log(`✅ Synced ${synced}/${users.length} users\n`);
}

async function syncNotes() {
    console.log('📝 Syncing notes to Gorse...');

    const notes = await prismaAny.notes.findMany({
        where: {
            is_deleted: false,
            is_active: true,
            is_approved: true
        },
        select: {
            id: true,
            subject: true,
            degree: true,
            specialization: true,
            semester: true,
            tags: true,
            is_active: true,
            is_approved: true
        }
    });

    let synced = 0;
    for (const note of notes) {
        try {
            const categories = [note.degree];
            if (note.specialization) categories.push(note.specialization);

            const labels = [note.subject, `semester-${note.semester}`];
            if (note.tags && Array.isArray(note.tags)) {
                labels.push(...note.tags);
            }

            await gorseService.upsertNote(
                note.id,
                categories,
                labels,
                !note.is_active || !note.is_approved
            );

            synced++;
            if (synced % 100 === 0) {
                console.log(`  ✓ Synced ${synced}/${notes.length} notes`);
            }
        } catch (error) {
            console.error(`  ✗ Failed to sync note ${note.id}:`, error);
        }
    }

    console.log(`✅ Synced ${synced}/${notes.length} notes\n`);
}

async function syncPurchases() {
    console.log('💰 Syncing purchases to Gorse...');

    const purchases = await prismaAny.purchases.findMany({
        where: { is_active: true },
        select: {
            user_id: true,
            note_id: true,
            created_at: true
        },
        orderBy: { created_at: 'asc' }
    });

    let synced = 0;
    for (const purchase of purchases) {
        try {
            await gorseService.trackInteraction(
                purchase.user_id,
                purchase.note_id,
                'purchase'
            );

            synced++;
            if (synced % 100 === 0) {
                console.log(`  ✓ Synced ${synced}/${purchases.length} purchases`);
            }
        } catch (error) {
            console.error(`  ✗ Failed to sync purchase:`, error);
        }
    }

    console.log(`✅ Synced ${synced}/${purchases.length} purchases\n`);
}

async function syncViews() {
    console.log('👁️  Syncing view data (estimated from view_count)...');

    // We can't recreate exact view history, but we can simulate popularity
    // by creating approximate view events for high-view-count notes

    const popularNotes = await prismaAny.notes.findMany({
        where: {
            is_deleted: false,
            is_active: true,
            view_count: { gt: 0 }
        },
        select: {
            id: true,
            view_count: true,
            purchases: {
                select: { user_id: true },
                take: 10  // Sample users who purchased
            }
        },
        orderBy: { view_count: 'desc' },
        take: 500  // Top 500 notes
    });

    let synced = 0;
    for (const note of popularNotes) {
        try {
            // Create view events from purchasers (rough approximation)
            for (const purchase of note.purchases) {
                await gorseService.trackInteraction(
                    purchase.user_id,
                    note.id,
                    'view'
                );
            }

            synced++;
            if (synced % 50 === 0) {
                console.log(`  ✓ Synced ${synced}/${popularNotes.length} note views`);
            }
        } catch (error) {
            console.error(`  ✗ Failed to sync views for ${note.id}:`, error);
        }
    }

    console.log(`✅ Synced view data for ${synced}/${popularNotes.length} notes\n`);
}

async function main() {
    console.log('\n🚀 Starting Gorse Data Sync\n');
    console.log('━'.repeat(50));

    try {
        await prisma.$connect();
        console.log('✅ Database connected\n');

        // Sync in order
        await syncUsers();
        await syncNotes();
        await syncPurchases();
        await syncViews();

        console.log('━'.repeat(50));
        console.log('\n✅ SYNC COMPLETE!\n');
        console.log('Next steps:');
        console.log('1. Wait 5-10 minutes for Gorse to process');
        console.log('2. Check Gorse dashboard: http://localhost:8086');
        console.log('3. Test recommendations: GET /api/recommendations\n');

    } catch (error) {
        console.error('\n❌ SYNC FAILED:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
