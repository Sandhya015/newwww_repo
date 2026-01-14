interface ToastOptions {
    message?: string;
    description?: string;
    position?: 'top-left' | 'top-right' | 'top-center' | 'bottom-left' | 'bottom-right' | 'bottom-center';
    duration?: number;
    type?: 'success' | 'error' | 'warning' | 'info';
}

// Global toast function reference
let globalShowToast: ((options: ToastOptions) => void) | null = null;
let globalHideToast: (() => void) | null = null;

// Set the global toast functions (called from ToastProvider)
export const setGlobalToastFunctions = (
    showToast: (options: ToastOptions) => void,
    hideToast: () => void
) => {
    globalShowToast = showToast;
    globalHideToast = hideToast;
};

// Direct toast function that can be called from anywhere
export const showToast = (options: ToastOptions) => {
    if (globalShowToast) {
        globalShowToast(options);
    } else {
        console.warn('Toast system not initialized. Make sure ToastProvider is wrapping your app.');
    }
};

export const hideToast = () => {
    if (globalHideToast) {
        globalHideToast();
    }
};

// Convenience functions for common toast types
export const showSuccessToast = (message: string, description?: string) => {
    showToast({
        message,
        description,
        position: 'top-right',
        duration: 3000
    });
};

export const showErrorToast = (message: string, description?: string) => {
    showToast({
        message,
        description,
        position: 'top-right',
        duration: 5000
    });
};

export const showInfoToast = (message: string, description?: string) => {
    showToast({
        message,
        description,
        position: 'top-right',
        duration: 4000
    });
};