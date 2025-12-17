import app from './app';
import { prisma } from './config/database';
import { CronService } from './services/cronService';

const PORT = process.env.PORT || 5001;

async function start() {
    try {
        await prisma.$connect();
        console.log('Database connected successfully');

        // Initialize Cron Service (Broadcasts, Escrow)
        CronService.init();

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to connect to database', error);
        process.exit(1);
    }
}

start();
