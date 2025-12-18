/**
 * ADMIN UI STATE VALIDATOR
 * Validates frontend UI behavior under all conditions
 */

import { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';

export class AdminUIStateValidator {
    /**
     * Validate success toast appears with correct message
     */
    static async validateSuccessToast(page: Page, expectedMessage: string): Promise<void> {
        const toast = page.locator('[data-testid="toast-success"]');
        await expect(toast).toBeVisible({ timeout: 3000 });
        await expect(toast).toContainText(expectedMessage);

        // Toast should auto-dismiss after 3s
        await expect(toast).not.toBeVisible({ timeout: 5000 });
    }

    /**
     * Validate error toast appears
     */
    static async validateErrorToast(page: Page, expectedMessage: string): Promise<void> {
        const toast = page.locator('[data-testid="toast-error"]');
        await expect(toast).toBeVisible({ timeout: 3000 });
        await expect(toast).toContainText(expectedMessage);
    }

    /**
     * Validate loading spinner visible
     */
    static async validateLoadingState(page: Page, shouldBeVisible: boolean): Promise<void> {
        const spinner = page.locator('[data-testid="loading-spinner"]');
        if (shouldBeVisible) {
            await expect(spinner).toBeVisible({ timeout: 1000 });
        } else {
            await expect(spinner).not.toBeVisible({ timeout: 3000 });
        }
    }

    /**
     * Validate redirect occurred
     */
    static async validateRedirect(page: Page, expectedURL: string): Promise<void> {
        await page.waitForURL(expectedURL, { timeout: 5000 });
        expect(page.url()).toContain(expectedURL);
    }

    /**
     * Validate modal opened
     */
    static async validateModalOpen(page: Page, modalTestId: string): Promise<void> {
        const modal = page.locator(`[data-testid="${modalTestId}"]`);
        await expect(modal).toBeVisible({ timeout: 2000 });
    }

    /**
     * Validate modal closed
     */
    static async validateModalClosed(page: Page, modalTestId: string): Promise<void> {
        const modal = page.locator(`[data-testid="${modalTestId}"]`);
        await expect(modal).not.toBeVisible({ timeout: 2000 });
    }

    /**
     * Validate table updated (row count changed)
     */
    static async validateTableUpdated(page: Page, tableTestId: string, expectedRowCount: number): Promise<void> {
        const rows = page.locator(`[data-testid="${tableTestId}"] tbody tr`);
        await expect(rows).toHaveCount(expectedRowCount, { timeout: 3000 });
    }

    /**
     * Validate no stale data (data refreshed)
     */
    static async validateNoStaleData(page: Page, dataTestId: string, expectedValue: string): Promise<void> {
        const element = page.locator(`[data-testid="${dataTestId}"]`);
        await expect(element).toHaveText(expectedValue, { timeout: 3000 });
    }

    /**
     * Validate button disabled during action
     */
    static async validateButtonDisabledDuringAction(page: Page, buttonTestId: string): Promise<void> {
        const button = page.locator(`[data-testid="${buttonTestId}"]`);
        await expect(button).toBeDisabled({ timeout: 1000 });
    }

    /**
     * Validate error boundary displayed
     */
    static async validateErrorBoundary(page: Page, errorMessage?: string): Promise<void> {
        const errorBoundary = page.locator('[data-testid="error-boundary"]');
        await expect(errorBoundary).toBeVisible({ timeout: 3000 });

        if (errorMessage) {
            await expect(errorBoundary).toContainText(errorMessage);
        }
    }

    /**
     * Validate retry button appears
     */
    static async validateRetryButton(page: Page): Promise<void> {
        const retryButton = page.locator('[data-testid="retry-button"]');
        await expect(retryButton).toBeVisible({ timeout: 3000 });
        await expect(retryButton).toBeEnabled();
    }

    /**
     * Validate offline mode indicator
     */
    static async validateOfflineMode(page: Page, isOffline: boolean): Promise<void> {
        const offlineIndicator = page.locator('[data-testid="offline-indicator"]');

        if (isOffline) {
            await expect(offlineIndicator).toBeVisible({ timeout: 3000 });
            await expect(offlineIndicator).toContainText('No connection');
        } else {
            await expect(offlineIndicator).not.toBeVisible();
        }
    }

    /**
     * Validate JWT stored in localStorage
     */
    static async validateJWTStored(page: Page): Promise<void> {
        const token = await page.evaluate(() => localStorage.getItem('accessToken'));
        expect(token).toBeTruthy();
        expect(token).toMatch(/^eyJ/); // JWT pattern
    }

    /**
     * Validate JWT cleared from localStorage
     */
    static async validateJWTCleared(page: Page): Promise<void> {
        const token = await page.evaluate(() => localStorage.getItem('accessToken'));
        expect(token).toBeNull();
    }

    /**
     * Validate admin dashboard loaded
     */
    static async validateAdminDashboard(page: Page): Promise<void> {
        await expect(page.locator('[data-testid="admin-dashboard"]')).toBeVisible({ timeout: 5000 });
        await expect(page.locator('[data-testid="admin-sidebar"]')).toBeVisible();
        await expect(page.locator('[data-testid="admin-header"]')).toBeVisible();
    }
}
