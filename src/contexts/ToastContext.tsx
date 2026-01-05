/**
 * Toast Context et Provider
 * Gestion centralisée des toasts dans toute l'application
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { hapticSuccess, hapticError, hapticWarning, hapticLight } from '../utils/haptics';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastConfig {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
  icon?: string;
}

interface ToastContextType {
  toasts: ToastConfig[];
  showToast: (type: ToastType, message: string, duration?: number) => void;
  hideToast: (id: string) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: ReactNode;
  maxToasts?: number;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ 
  children, 
  maxToasts = 3 
}) => {
  const [toasts, setToasts] = useState<ToastConfig[]>([]);

  const hideToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const showToast = useCallback((
    type: ToastType, 
    message: string, 
    duration: number = 3000
  ) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    
    const newToast: ToastConfig = {
      id,
      type,
      message,
      duration,
    };

    setToasts(prev => {
      const updated = [...prev, newToast];
      // Limiter le nombre de toasts affichés
      return updated.slice(-maxToasts);
    });

    // Auto-dismiss
    if (duration > 0) {
      setTimeout(() => {
        hideToast(id);
      }, duration);
    }
  }, [maxToasts, hideToast]);

  const success = useCallback((message: string, duration?: number) => {
    hapticSuccess();
    showToast('success', message, duration);
  }, [showToast]);

  const error = useCallback((message: string, duration?: number) => {
    hapticError();
    showToast('error', message, duration);
  }, [showToast]);

  const warning = useCallback((message: string, duration?: number) => {
    hapticWarning();
    showToast('warning', message, duration);
  }, [showToast]);

  const info = useCallback((message: string, duration?: number) => {
    hapticLight();
    showToast('info', message, duration);
  }, [showToast]);

  return (
    <ToastContext.Provider
      value={{
        toasts,
        showToast,
        hideToast,
        success,
        error,
        warning,
        info,
      }}
    >
      {children}
    </ToastContext.Provider>
  );
};
