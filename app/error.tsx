'use client'

import { useEffect } from 'react'
import { Logo } from '@/components/ui/logo'
import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <Logo size="xl" href="/" className="justify-center" />
        </div>
        
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Oops!</h1>
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Something went wrong</h2>
        <p className="text-gray-600 mb-8">
          We encountered an unexpected error. Please try again or contact support if the problem persists.
        </p>
        
        <div className="space-y-4">
          <Button onClick={reset} className="w-full">
            Try Again
          </Button>
          <Button variant="outline" onClick={() => window.location.href = '/'} className="w-full">
            Go to Home
          </Button>
        </div>
      </div>
    </div>
  )
}
