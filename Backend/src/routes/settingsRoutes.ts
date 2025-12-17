import { Router } from 'express';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';
import fs from 'fs';
import path from 'path';

const router = Router();

interface PlatformSettings {
    defaultCommission: number;
    premiumCommission: number;
    minPayoutAmount: number;
    payoutProcessingDays: number;
    maintenanceMode: boolean;
    requireEmailVerify: boolean;
    platformName: string;
    supportEmail: string;
}

const SETTINGS_FILE = path.join(__dirname, '../../config/platform-settings.json');

// Default settings
const DEFAULT_SETTINGS: PlatformSettings = {
    defaultCommission: 15,
    premiumCommission: 10,
    minPayoutAmount: 500,
    payoutProcessingDays: 7,
    maintenanceMode: false,
    requireEmailVerify: true,
    platformName: 'StudyVault',
    supportEmail: 'support@studyvault.com'
};

// Helper to read settings
function readSettings(): PlatformSettings {
    try {
        if (fs.existsSync(SETTINGS_FILE)) {
            const data = fs.readFileSync(SETTINGS_FILE, 'utf8');
            return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
        }
    } catch (error) {
        console.error('Error reading settings file:', error);
    }
    return DEFAULT_SETTINGS;
}

// Helper to write settings
function writeSettings(settings: PlatformSettings): void {
    try {
        const dir = path.dirname(SETTINGS_FILE);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
    } catch (error) {
        console.error('Error writing settings file:', error);
        throw error;
    }
}

// GET /api/admin/settings
router.get('/', authenticate, requireAdmin, async (req: AuthRequest, res) => {
    try {
        const settings = readSettings();

        return res.json({
            success: true,
            data: settings
        });
    } catch (error: any) {
        console.error('Get settings error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch settings',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// PUT /api/admin/settings
router.put('/', authenticate, requireAdmin, async (req: AuthRequest, res) => {
    try {
        const updates = req.body;

        // Validate settings
        const currentSettings = readSettings();
        const newSettings: PlatformSettings = {
            defaultCommission: Number(updates.defaultCommission ?? currentSettings.defaultCommission),
            premiumCommission: Number(updates.premiumCommission ?? currentSettings.premiumCommission),
            minPayoutAmount: Number(updates.minPayoutAmount ?? currentSettings.minPayoutAmount),
            payoutProcessingDays: Number(updates.payoutProcessingDays ?? currentSettings.payoutProcessingDays),
            maintenanceMode: Boolean(updates.maintenanceMode ?? currentSettings.maintenanceMode),
            requireEmailVerify: Boolean(updates.requireEmailVerify ?? currentSettings.requireEmailVerify),
            platformName: String(updates.platformName ?? currentSettings.platformName),
            supportEmail: String(updates.supportEmail ?? currentSettings.supportEmail)
        };

        // Validate ranges
        if (newSettings.defaultCommission < 0 || newSettings.defaultCommission > 100) {
            return res.status(400).json({
                success: false,
                message: 'Default commission must be between 0 and 100'
            });
        }

        if (newSettings.premiumCommission < 0 || newSettings.premiumCommission > 100) {
            return res.status(400).json({
                success: false,
                message: 'Premium commission must be between 0 and 100'
            });
        }

        if (newSettings.minPayoutAmount < 0) {
            return res.status(400).json({
                success: false,
                message: 'Minimum payout amount must be positive'
            });
        }

        // Save settings
        writeSettings(newSettings);

        return res.json({
            success: true,
            data: newSettings,
            message: 'Settings updated successfully'
        });
    } catch (error: any) {
        console.error('Update settings error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update settings',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

export default router;
