import cron from 'node-cron';
import { multiEmailService } from './multiProviderEmailService';
import { logger } from './logger';

/**
 * GOD-LEVEL EMAIL MONITORING & AUTOMATION
 * 
 * Features:
 * - Monthly counter reset (1st of month)
 * - Daily usage monitoring
 * - Alert on high usage (>80%)
 * - Statistics logging
 */

/**
 * Reset email counters on 1st of every month at 00:00
 */
export const scheduleMonthlyReset = () => {
    cron.schedule('0 0 1 * *', () => {
        console.log('🔄 Running monthly email counter reset...');

        try {
            multiEmailService.resetMonthlyCounters();
            logger.info('[EMAIL-CRON] Monthly counters reset successfully');
        } catch (error) {
            logger.error('[EMAIL-CRON] Failed to reset monthly counters', { error });
        }
    });

    console.log('✅ Email monthly reset cron scheduled (1st of month, 00:00)');
};

/**
 * Daily email usage monitoring (runs at 09:00 every day)
 */
export const scheduleDailyMonitoring = () => {
    cron.schedule('0 9 * * *', async () => {
        console.log('📊 Running daily email usage monitoring...');

        try {
            const stats = multiEmailService.getStats();
            const totalStats = multiEmailService.getTotalStats();

            // Log statistics
            logger.info('[EMAIL-STATS] Daily email usage', {
                total: totalStats,
                providers: stats,
            });

            // Check for high usage (>80%)
            const highUsageProviders = stats.filter(s => s.percentage > 80 && s.enabled);

            if (highUsageProviders.length > 0) {
                logger.warn('[EMAIL-ALERT] High usage detected', {
                    providers: highUsageProviders.map(p => ({
                        name: p.name,
                        usage: `${p.used}/${p.limit} (${p.percentage}%)`,
                    })),
                });

                console.warn('⚠️ EMAIL USAGE WARNING:');
                highUsageProviders.forEach(p => {
                    console.warn(`  ${p.name}: ${p.used}/${p.limit} (${p.percentage}%)`);
                });
            }

            // Check if approaching total limit (>90%)
            if (totalStats.percentage > 90) {
                logger.error('[EMAIL-ALERT] Critical - Approaching total email limit', {
                    total: `${totalStats.totalUsed}/${totalStats.totalLimit} (${totalStats.percentage}%)`,
                });

                console.error('🚨 CRITICAL: Email limit almost reached!');
                console.error(`  Total: ${totalStats.totalUsed}/${totalStats.totalLimit} (${totalStats.percentage}%)`);
            }
        } catch (error) {
            logger.error('[EMAIL-CRON] Daily monitoring failed', { error });
        }
    });

    console.log('✅ Email daily monitoring cron scheduled (09:00 every day)');
};

/**
 * Initialize all email cron jobs
 */
export const initializeEmailCrons = () => {
    scheduleMonthlyReset();
    scheduleDailyMonitoring();

    // Log current stats on startup
    setTimeout(() => {
        const stats = multiEmailService.getStats();
        const totalStats = multiEmailService.getTotalStats();

        console.log('\n📧 EMAIL SYSTEM INITIALIZED:');
        console.log(`  Total Capacity: ${totalStats.totalLimit} emails/month`);
        console.log(`  Current Usage: ${totalStats.totalUsed}/${totalStats.totalLimit} (${totalStats.percentage}%)`);
        console.log(`  Providers Enabled: ${totalStats.providersEnabled}/${totalStats.providersTotal}`);
        console.log('\n  Provider Details:');
        stats.forEach(s => {
            const status = s.enabled ? (s.status === 'OK' ? '✅' : s.status === 'WARNING' ? '⚠️' : '❌') : '⏸️';
            console.log(`  ${status} ${s.name}: ${s.used}/${s.limit} (${s.percentage}%) ${!s.enabled ? '[NOT CONFIGURED]' : ''}`);
        });
        console.log('');
    }, 1000);
};
