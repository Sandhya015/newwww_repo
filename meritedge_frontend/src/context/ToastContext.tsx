// context/ToastContext.tsx
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import Toster from '../components/ui/Toster';
import { setGlobalToastFunctions } from '../utils/toast';

interface ToastOptions {
    message?: string;
    description?: string;
    position?: 'top-left' | 'top-right' | 'top-center' | 'bottom-left' | 'bottom-right' | 'bottom-center';
    duration?: number;
    type?: 'success' | 'error' | 'warning' | 'info';
}

interface ToastContextType {
    showToast: (options: ToastOptions) => void;
    hideToast: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

interface ToastProviderProps {
    children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
    const [toastConfig, setToastConfig] = useState<ToastOptions & { visible: boolean }>({
        visible: false,
        message: "",
        description: "",
        position: 'top-right',
        duration: 3000,
        type: 'success',
    });

    const showToast = (options: ToastOptions) => {
        setToastConfig({
            visible: true,
            message: options.message || "",
            description: options.description || "",
            position: options.position || 'top-right',
            duration: options.duration || 3000,
            type: options.type || 'success',
        });
    };

    const hideToast = () => {
        setToastConfig(prev => ({ ...prev, visible: false }));
    };

    // Set global toast functions when provider mounts
    useEffect(() => {
        setGlobalToastFunctions(showToast, hideToast);
    }, []);

    return (
        <ToastContext.Provider value={{ showToast, hideToast }}>
            {children}
            {toastConfig.visible && (
                <Toster
                    message={toastConfig.message}
                    description={toastConfig.description}
                    position={toastConfig.position}
                    duration={toastConfig.duration}
                    type={toastConfig.type}
                    onClose={hideToast}
                />
            )}
        </ToastContext.Provider>
    );
};

// Keep the hook for components that prefer to use it
export const useToast = (): ToastContextType => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};