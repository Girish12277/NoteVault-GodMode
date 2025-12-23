import { toast } from 'sonner';

/**
 * GOD-LEVEL TOAST NOTIFICATION HELPERS
 * Ensures all toasts have clear, actionable messages with descriptions
 */

export const showToast = {
    /**
     * Success toast with optional description
     */
    success: (message: string, description?: string) => {
        toast.success(message, {
            description,
            duration: 4000,
        });
    },

    /**
     * Error toast with mandatory description explaining the issue
     */
    error: (message: string, description?: string) => {
        toast.error(message, {
            description: description || 'Please try again or contact support if the issue persists.',
            duration: 6000,
        });
    },

    /**
     * Warning toast
     */
    warning: (message: string, description?: string) => {
        toast.warning(message, {
            description,
            duration: 5000,
        });
    },

    /**
     * Info toast
     */
    info: (message: string, description?: string) => {
        toast.info(message, {
            description,
            duration: 4000,
        });
    },

    /**
     * Promise toast for async operations
     */
    promise: <T,>(
        promise: Promise<T>,
        messages: {
            loading: string;
            success: string | ((data: T) => string);
            error: string | ((error: any) => string);
        }
    ) => {
        return toast.promise(promise, messages);
    },
};

/**
 * Common error messages with descriptions
 */
export const ErrorMessages = {
    NETWORK: {
        message: 'Network Error',
        description: 'Please check your internet connection and try again.',
    },
    UNAUTHORIZED: {
        message: 'Authentication Required',
        description: 'Please log in to continue.',
    },
    FORBIDDEN: {
        message: 'Access Denied',
        description: 'You do not have permission to perform this action.',
    },
    NOT_FOUND: {
        message: 'Not Found',
        description: 'The requested resource could not be found.',
    },
    SERVER_ERROR: {
        message: 'Server Error',
        description: 'An unexpected error occurred. Our team has been notified.',
    },
    VALIDATION_ERROR: {
        message: 'Validation Failed',
        description: 'Please check your input and try again.',
    },
};
