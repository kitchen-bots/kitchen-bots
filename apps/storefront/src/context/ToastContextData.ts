import React from 'react';

export interface Toast {
  id: number;
  message: string;
  type?: 'success' | 'info' | 'error';
  actionLabel?: string;
  onAction?: () => void;
}

export interface ToastContextType {
  showToast: (message: string, actionLabel?: string, onAction?: () => void) => void;
}

export const ToastContext = React.createContext<ToastContextType | undefined>(undefined);
