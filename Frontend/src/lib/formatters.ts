/**
 * Number and currency formatting utilities
 * Provides consistent formatting across the application
 */

/**
 * Formats a number with thousand separators
 * @param num - Number to format
 * @returns Formatted string with commas (e.g., "1,234")
 */
export function formatNumber(num: number | string | null | undefined): string {
    if (num === null || num === undefined || num === '') return '0';

    const numValue = typeof num === 'string' ? parseFloat(num) : num;

    if (isNaN(numValue)) return '0';

    return new Intl.NumberFormat('en-IN').format(numValue);
}

/**
 * Formats currency with symbol and thousand separators
 * @param amount - Amount to format
 * @param currency - Currency code (default: 'INR')
 * @returns Formatted currency string (e.g., "₹1,234")
 */
export function formatCurrency(
    amount: number | string | null | undefined,
    currency: 'INR' | 'USD' = 'INR'
): string {
    if (amount === null || amount === undefined || amount === '') return '₹0';

    const numValue = typeof amount === 'string' ? parseFloat(amount) : amount;

    if (isNaN(numValue)) return '₹0';

    const symbol = currency === 'INR' ? '₹' : '$';
    const formatted = new Intl.NumberFormat('en-IN').format(numValue);

    return `${symbol}${formatted}`;
}

/**
 * Formats large numbers in compact notation
 * @param num - Number to format
 * @returns Compact string (e.g., "1.2K", "1M", "1B")
 */
export function formatCompact(num: number | string | null | undefined): string {
    if (num === null || num === undefined || num === '') return '0';

    const numValue = typeof num === 'string' ? parseFloat(num) : num;

    if (isNaN(numValue)) return '0';

    // For numbers less than 1000, no formatting needed
    if (numValue < 1000) return numValue.toString();

    // For numbers >= 1000, use compact notation
    return new Intl.NumberFormat('en-IN', {
        notation: 'compact',
        compactDisplay: 'short',
        maximumFractionDigits: 1
    }).format(numValue);
}

/**
 * Formats a percentage
 * @param value - Value to format as percentage (0-100 or 0-1)
 * @param normalize - If true, treats value as 0-1 and multiplies by 100
 * @returns Formatted percentage string (e.g., "95.5%")
 */
export function formatPercentage(
    value: number | string | null | undefined,
    normalize: boolean = false
): string {
    if (value === null || value === undefined || value === '') return '0%';

    const numValue = typeof value === 'string' ? parseFloat(value) : value;

    if (isNaN(numValue)) return '0%';

    const percentage = normalize ? numValue * 100 : numValue;

    return `${percentage.toFixed(1)}%`;
}

/**
 * Formats file size in human-readable format
 * @param bytes - Size in bytes
 * @returns Formatted size string (e.g., "1.5 MB")
 */
export function formatFileSize(bytes: number | null | undefined): string {
    if (bytes === null || bytes === undefined || bytes === 0) return '0 B';

    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const k = 1024;
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${units[i]}`;
}
