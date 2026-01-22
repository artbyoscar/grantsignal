import { toast as sonnerToast } from 'sonner';

export interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
}

export const toast = ({
  message,
  type,
  action,
  duration = 5000,
}: ToastProps) => {
  const toastOptions = {
    duration,
    action: action
      ? {
          label: action.label,
          onClick: action.onClick,
        }
      : undefined,
  };

  switch (type) {
    case 'success':
      return sonnerToast.success(message, toastOptions);
    case 'error':
      return sonnerToast.error(message, toastOptions);
    case 'info':
      return sonnerToast.info(message, toastOptions);
    default:
      return sonnerToast(message, toastOptions);
  }
};

// Convenience methods for common use cases
toast.success = (message: string, options?: Omit<ToastProps, 'message' | 'type'>) =>
  toast({ message, type: 'success', ...options });

toast.error = (message: string, options?: Omit<ToastProps, 'message' | 'type'>) =>
  toast({ message, type: 'error', ...options });

toast.info = (message: string, options?: Omit<ToastProps, 'message' | 'type'>) =>
  toast({ message, type: 'info', ...options });

// Direct access to sonner's promise and loading methods
toast.promise = sonnerToast.promise;
toast.loading = sonnerToast.loading;
toast.dismiss = sonnerToast.dismiss;
