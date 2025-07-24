import React, { createContext, useContext, useState, useCallback } from 'react'
import { X, CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

interface ToastContextType {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  clearAll: () => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

const ToastIcon: React.FC<{ type: ToastType }> = ({ type }) => {
  const iconProps = { className: 'w-5 h-5' }
  
  switch (type) {
    case 'success':
      return <CheckCircle {...iconProps} className="w-5 h-5 text-green-600" />
    case 'error':
      return <XCircle {...iconProps} className="w-5 h-5 text-red-600" />
    case 'warning':
      return <AlertTriangle {...iconProps} className="w-5 h-5 text-yellow-600" />
    case 'info':
      return <Info {...iconProps} className="w-5 h-5 text-blue-600" />
    default:
      return <Info {...iconProps} className="w-5 h-5 text-gray-600" />
  }
}

const ToastItem: React.FC<{
  toast: Toast
  onRemove: (id: string) => void
}> = ({ toast, onRemove }) => {
  const [isVisible, setIsVisible] = useState(true)

  const handleRemove = useCallback(() => {
    setIsVisible(false)
    setTimeout(() => onRemove(toast.id), 300)
  }, [toast.id, onRemove])

  React.useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const timer = setTimeout(handleRemove, toast.duration)
      return () => clearTimeout(timer)
    }
  }, [toast.duration, handleRemove])

  const bgColors = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    warning: 'bg-yellow-50 border-yellow-200',
    info: 'bg-blue-50 border-blue-200'
  }

  return (
    <div
      className={cn(
        'flex items-start p-4 rounded-lg border shadow-lg transition-all duration-300 transform',
        bgColors[toast.type],
        isVisible 
          ? 'translate-x-0 opacity-100 scale-100' 
          : 'translate-x-full opacity-0 scale-95'
      )}
      data-testid="toast-item"
    >
      <ToastIcon type={toast.type} />
      <div className="ml-3 flex-1">
        <h4 className="text-sm font-medium text-gray-900">{toast.title}</h4>
        {toast.message && (
          <p className="mt-1 text-sm text-gray-600">{toast.message}</p>
        )}
        {toast.action && (
          <button
            onClick={toast.action.onClick}
            className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-500 underline"
          >
            {toast.action.label}
          </button>
        )}
      </div>
      <button
        onClick={handleRemove}
        className="ml-4 inline-flex text-gray-400 hover:text-gray-600 focus:outline-none"
        data-testid="toast-close"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast: Toast = {
      ...toast,
      id,
      duration: toast.duration ?? 5000
    }
    setToasts(prev => [...prev, newToast])
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const clearAll = useCallback(() => {
    setToasts([])
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, clearAll }}>
      {children}
      <div
        className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full"
        data-testid="toast-container"
      >
        {toasts.map(toast => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onRemove={removeToast}
          />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

// Convenience hooks for different toast types
export const useSuccessToast = () => {
  const { addToast } = useToast()
  return useCallback((title: string, message?: string) => {
    addToast({ type: 'success', title, message })
  }, [addToast])
}

export const useErrorToast = () => {
  const { addToast } = useToast()
  return useCallback((title: string, message?: string) => {
    addToast({ type: 'error', title, message, duration: 7000 })
  }, [addToast])
}

export const useWarningToast = () => {
  const { addToast } = useToast()
  return useCallback((title: string, message?: string) => {
    addToast({ type: 'warning', title, message })
  }, [addToast])
}

export const useInfoToast = () => {
  const { addToast } = useToast()
  return useCallback((title: string, message?: string) => {
    addToast({ type: 'info', title, message })
  }, [addToast])
}

// GDPR-specific toast messages
export const useGDPRToasts = () => {
  const successToast = useSuccessToast()
  const errorToast = useErrorToast()
  const warningToast = useWarningToast()
  const infoToast = useInfoToast()

  return {
    consentRecorded: (type: string) => 
      successToast('Consent Recorded', `${type} consent has been recorded successfully.`),
    
    consentWithdrawn: (type: string) => 
      warningToast('Consent Withdrawn', `${type} consent has been withdrawn.`),
    
    dataRequestSubmitted: (type: string) => 
      infoToast('Request Submitted', `Your ${type} request has been submitted and will be processed within 30 days.`),
    
    dataRequestCompleted: (type: string) => 
      successToast('Request Completed', `Your ${type} request has been completed.`),
    
    dataExportReady: (downloadUrl: string) => 
      successToast('Your data export is ready for download.', downloadUrl),
    
    complianceWarning: (message: string) => 
      warningToast('Compliance Warning', message),
    
    dataRetentionApplied: (deletedCount: number) => 
      infoToast('Data Retention', `Data retention policies applied. ${deletedCount} records were cleaned up.`),
    
    auditLogCreated: () => 
      infoToast('Activity Logged', 'This action has been recorded in the audit log.'),
    
    error: (action: string, error?: string) => 
      errorToast(`${action} Failed`, error || 'An unexpected error occurred. Please try again.'),
  }
}

// Helper function to show GDPR compliance notifications
export const showGDPRNotification = (
  type: 'consent_given' | 'consent_withdrawn' | 'request_submitted' | 'request_completed' | 'data_exported',
  details: any,
  toast: ReturnType<typeof useGDPRToasts>
) => {
  switch (type) {
    case 'consent_given':
      toast.consentRecorded(details.consentType)
      break
    case 'consent_withdrawn':
      toast.consentWithdrawn(details.consentType)
      break
    case 'request_submitted':
      toast.dataRequestSubmitted(details.requestType)
      break
    case 'request_completed':
      toast.dataRequestCompleted(details.requestType)
      break
    case 'data_exported':
      toast.dataExportReady(details.downloadUrl)
      break
    default:
      console.warn('Unknown GDPR notification type:', type)
  }
}
