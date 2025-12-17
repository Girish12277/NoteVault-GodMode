import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Required environment variables for the application
const requiredEnvVars = [
    'DATABASE_URL',
    'JWT_SECRET'
];

// Optional but recommended environment variables
const recommendedEnvVars = [
    'RAZORPAY_KEY_ID',
    'RAZORPAY_KEY_SECRET',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
    'FRONTEND_URL'
];

/**
 * Validates that all required environment variables are present
 * Exits the process if any critical variables are missing
 */
export const validateEnv = () => {
    const missing: string[] = [];
    const missingRecommended: string[] = [];

    // Check required variables
    for (const envVar of requiredEnvVars) {
        if (!process.env[envVar]) {
            missing.push(envVar);
        }
    }

    // Check recommended variables
    for (const envVar of recommendedEnvVars) {
        if (!process.env[envVar]) {
            missingRecommended.push(envVar);
        }
    }

    // Exit if critical variables are missing
    if (missing.length > 0) {
        console.error('❌ CRITICAL: Missing required environment variables:');
        missing.forEach(v => console.error(`   - ${v}`));
        console.error('\n💡 Please add these to your .env file');
        console.error('   Copy .env.example to .env and fill in the values\n');
        process.exit(1);
    }

    // Warn about missing recommended variables
    if (missingRecommended.length > 0) {
        console.warn('⚠️  Missing recommended environment variables:');
        missingRecommended.forEach(v => console.warn(`   - ${v}`));
        console.warn('   Some features may not work without these\n');
    } else {
        console.log('✅ All environment variables configured\n');
    }
};

/**
 * Application configuration object
 */
export const config = {
    // Server
    port: parseInt(process.env.PORT || '5000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',

    // Database
    databaseUrl: process.env.DATABASE_URL!,

    // JWT
    jwtSecret: process.env.JWT_SECRET!,
    jwtExpiry: process.env.JWT_EXPIRY || '2h',
    jwtRefreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',

    // Razorpay (optional - payment feature)
    razorpay: {
        keyId: process.env.RAZORPAY_KEY_ID,
        keySecret: process.env.RAZORPAY_KEY_SECRET,
        enabled: !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET)
    },

    // Cloudinary (optional - file upload feature)
    cloudinary: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        apiKey: process.env.CLOUDINARY_API_KEY,
        apiSecret: process.env.CLOUDINARY_API_SECRET,
        enabled: !!(
            process.env.CLOUDINARY_CLOUD_NAME &&
            process.env.CLOUDINARY_API_KEY &&
            process.env.CLOUDINARY_API_SECRET
        )
    },

    // CORS
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',

    // SMTP (optional - email feature)
    smtp: {
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
        from: process.env.SMTP_FROM,
        enabled: !!(process.env.SMTP_HOST && process.env.SMTP_USER)
    }
};

/**
 * Check if specific features are enabled based on environment configuration
 */
export const features = {
    payments: config.razorpay.enabled,
    fileUpload: config.cloudinary.enabled,
    email: config.smtp.enabled
};
