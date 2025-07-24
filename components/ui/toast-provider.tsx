import React, { createContext, useContext, useCallback, useState } from 'react'
import { toast, Toaster } from 'sonner'
import { CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react'

interface ToastContextType {
  success: (message: string, description?: string) => void
  error: (message: string, description?: string) => void
  warning: (message: string, description?: string) => void
  info: (message: string, description?: string) => void
  gdprSuccess: (action: string, details?: string) => void
  gdprError: (action: string, error?: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

interface ToastProviderProps {
  children: React.ReactNode
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const success = useCallback((message: string, description?: string) => {
    toast.success(message, {
      description,
      icon: <CheckCircle className="w-4 h-4" />,
    })
  }, [])

  const error = useCallback((message: string, description?: string) => {
    toast.error(message, {
      description,
      icon: <XCircle className="w-4 h-4" />,
    })
  }, [])

  const warning = useCallback((message: string, description?: string) => {
    toast.warning(message, {
      description,
      icon: <AlertCircle className="w-4 h-4" />,
    })
  }, [])

  const info = useCallback((message: string, description?: string) => {
    toast.info(message, {
      description,
      icon: <Info className="w-4 h-4" />,
    })
  }, [])

  const gdprSuccess = useCallback((action: string, details?: string) => {
    const messages = {
      'consent-recorded': 'Consent Recorded Successfully',
      'consent-withdrawn': 'Consent Withdrawn',
      'request-submitted': 'Data Request Submitted',
      'request-processed': 'Data Request Processed',
      'data-exported': 'Data Export Generated',
      'data-deleted': 'Data Deleted Successfully'
    }

    const descriptions = {
      'consent-recorded': 'The consent has been recorded and will be applied to future communications.',
      'consent-withdrawn': 'The consent has been withdrawn and the contact will no longer receive this type of communication.',
      'request-submitted': 'Your data subject request has been submitted and will be processed within 30 days.',
      'request-processed': 'The data subject request has been processed successfully.',
      'data-exported': 'The data export has been generated and is ready for download.',
      'data-deleted': 'All personal data has been permanently deleted from our systems.'
    }

    success(
      messages[action as keyof typeof messages] || 'GDPR Action Completed',
      details || descriptions[action as keyof typeof descriptions]
    )
  }, [success])

  const gdprError = useCallback((action: string, error?: any) => {
    const messages = {
      'consent-failed': 'Failed to Record Consent',
      'withdrawal-failed': 'Failed to Withdraw Consent',
      'request-failed': 'Failed to Submit Request',
      'processing-failed': 'Failed to Process Request',
      'export-failed': 'Failed to Generate Export',
      'deletion-failed': 'Failed to Delete Data'
    }

    const descriptions = {
      'consent-failed': 'There was an error recording the consent. Please try again.',
      'withdrawal-failed': 'There was an error withdrawing consent. Please try again.',
      'request-failed': 'There was an error submitting your request. Please try again.',
      'processing-failed': 'There was an error processing the request. Please contact support.',
      'export-failed': 'There was an error generating the data export. Please try again.',
      'deletion-failed': 'There was an error deleting the data. Please contact support.'
    }

    throw Error(
      messages[action as keyof typeof messages] || 'GDPR Action Failed',
      error || descriptions[action as keyof typeof descriptions]
    )
  }, [error])

  const value = {
    success,
    error,
    warning,
    info,
    gdprSuccess,
    gdprError
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toaster
        position="top-right"
        expand={false}
        richColors
        closeButton
        toastOptions={{
          duration: 5000,
          className: 'font-medium',
        }}
      />
    </ToastContext.Provider>
  )
}

// Utility functions for common GDPR toast patterns
export const showConsentToast = (type: 'recorded' | 'withdrawn' | 'failed', details?: string) => {
  const { success, error } = useToast()
  
  switch (type) {
    case 'recorded':
      success('Consent Recorded', details || 'The consent preference has been saved successfully.')
      break
    case 'withdrawn':
      success('Consent Withdrawn', details || 'The consent has been withdrawn and will take effect immediately.')
      break
    case 'failed':
      error('Consent Action Failed', details || 'There was an error updating the consent preference.')
      break
  }
}

export const showDataRequestToast = (type: 'submitted' | 'processed' | 'failed', details?: string) => {
  const { success, error, info } = useToast()
  
  switch (type) {
    case 'submitted':
      info('Data Request Submitted', details || 'Your request will be processed within 30 days as required by GDPR.')
      break
    case 'processed':
      success('Request Processed', details || 'Your data subject request has been completed successfully.')
      break
    case 'failed':
      error('Request Failed', details || 'There was an error processing your request. Please contact support.')
      break
  }
}
