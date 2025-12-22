import app from './app';
import { prisma } from './config/database';
import { CronService } from './services/cronService';
import { initializeRedis } from './services/cacheService';
import http from 'http';

const PORT = process.env.PORT || 5001;

// Enhancement #8: Graceful Shutdown Implementation
let server: http.Server;
let isShuttingDown = false;

async function start() {
    try {
        await prisma.$connect();
        console.log('✅ Database connected successfully');

        // Initialize Redis (non-blocking - continues even if Redis fails)
        try {
            const redisInitialized = await initializeRedis();
            if (redisInitialized) {
                console.log('✅ Redis initialized successfully');
            } else {
                console.log('ℹ️  Redis: Disabled (Not Configured)');
            }
        } catch (redisError: any) {
            console.warn('⚠️  Redis initialization failed - caching disabled:', redisError.message);
            // Server continues without Redis (graceful degradation)
        }

        // Initialize Recommendation System (Phase 2)
        try {
            const { kafkaEventService } = await import('./services/kafkaEventService');
            const kafkaInitialized = await kafkaEventService.initialize();
            if (kafkaInitialized) {
                console.log('✅ Kafka event tracking initialized');
            } else {
                console.log('ℹ️  Kafka: Disabled (Brokers Not Set)');
            }
        } catch (kafkaError: any) {
            console.warn('⚠️  Kafka initialization failed - event tracking disabled:', kafkaError.message);
            // Server continues without Kafka (graceful degradation)
        }

        // Initialize Cron Service (Broadcasts, Escrow, Financial Reconciliation)
        CronService.init();
        console.log('⏰ Cron jobs initialized');

        server = app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`📊 Health check: http://localhost:${PORT}/health`);
            console.log(`📖 Swagger docs: http://localhost:${PORT}/api-docs`);
        });

        // Handle unhandled promise rejections
        process.on('unhandledRejection', (reason, promise) => {
            console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
            // Application specific logging, throwing an error, or other logic here
        });

    } catch (error) {
        console.error('💥 Failed to start server:', error);
        process.exit(1);
    }
}

/**
 * Graceful Shutdown Handler (Enhancement #8)
 * 
 * Ensures zero-data loss during deployments:
 * 1. Stop accepting new connections
 * 2. Close existing connections gracefully
 * 3. Disconnect from database
 * 4. Stop cron jobs
 * 5. Exit process
 */
async function gracefulShutdown(signal: string) {
    if (isShuttingDown) {
        console.log('⏳ Shutdown already in progress...');
        return;
    }

    isShuttingDown = true;
    console.log(`\n🛑 ${signal} received - starting graceful shutdown...`);

    const SHUTDOWN_TIMEOUT = 30000; // 30 seconds
    const shutdownTimer = setTimeout(() => {
        console.error('⚠️ Shutdown timeout exceeded - forcing exit');
        process.exit(1);
    }, SHUTDOWN_TIMEOUT);

    try {
        // 1. Stop accepting new connections
        if (server) {
            console.log('📭 Closing HTTP server (no new connections)...');
            await new Promise<void>((resolve, reject) => {
                server.close((err) => {
                    if (err) {
                        console.error('❌ Error closing server:', err);
                        reject(err);
                    } else {
                        console.log('✅ HTTP server closed');
                        resolve();
                    }
                });
            });
        }

        // 2. Stop cron jobs
        console.log('⏰ Stopping cron jobs...');
        CronService.stop();

        // 3. Shutdown Kafka event service
        console.log('📊 Disconnecting Kafka...');
        try {
            const { kafkaEventService } = await import('./services/kafkaEventService');
            await kafkaEventService.shutdown();
            console.log('✅ Kafka disconnected');
        } catch (error) {
            console.warn('⚠️  Kafka disconnect warning:', error);
        }

        // 4. Disconnect Redis (graceful)
        console.log('💾 Disconnecting Redis...');
        try {
            const { cacheService } = await import('./services/cacheService');
            await cacheService.disconnect();
            console.log('✅ Redis disconnected');
        } catch (error) {
            console.warn('⚠️  Redis disconnect warning:', error);
        }

        // Step 5: Disconnect database
        console.log('5. Disconnecting database...');
        await prisma.$disconnect();
        console.log('✅ Database disconnected');

        clearTimeout(shutdownTimer);
        console.log('✅ Graceful shutdown complete');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error during graceful shutdown:', error);
        clearTimeout(shutdownTimer);
        process.exit(1);
    }
}

// Signal handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM')); // Kubernetes, Docker
process.on('SIGINT', () => gracefulShutdown('SIGINT'));   // Ctrl+C
process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // Nodemon restart

export { start, gracefulShutdown };

// Only start if run directly
if (require.main === module) {
    start();
}
