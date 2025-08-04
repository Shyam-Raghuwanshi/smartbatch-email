"use client";

import { SignInButton, SignUpButton, useUser } from '@clerk/nextjs'
import Link from 'next/link'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Logo } from '@/components/ui/logo'

export default function Home() {
  const { isSignedIn, isLoaded } = useUser()
  const router = useRouter()

  // Redirect to dashboard if user is already signed in
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.replace('/dashboard')
    }
  }, [isSignedIn, isLoaded, router])

  // Show loading state while checking authentication
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Logo size="xl" />
          <div className="mt-4 animate-pulse">
            <div className="h-2 bg-blue-200 rounded w-32 mx-auto"></div>
          </div>
        </div>
      </div>
    )
  }

  // Don't render content if user is signed in (will redirect)
  if (isSignedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Logo size="xl" />
          <p className="mt-4 text-gray-600">Redirecting to dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Logo size="lg" href="/" />
            </div>
            <div className="flex space-x-4">
              <SignInButton mode="modal">
                <button className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                  Sign In
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                  Get Started
                </button>
              </SignUpButton>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
            <span className="block">Professional Email</span>
            <span className="block text-blue-600">Marketing Platform</span>
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-600">
            Send personalized email campaigns, track performance, and grow your business 
            with advanced analytics and automation tools.
          </p>
          <div className="mt-10 flex justify-center space-x-6">
            <SignUpButton mode="modal">
              <button className="bg-blue-600 hover:bg-blue-700 text-white text-lg font-medium py-3 px-8 rounded-lg shadow-lg transition-colors">
                Start Free Trial
              </button>
            </SignUpButton>
            <SignInButton mode="modal">
              <button className="bg-white hover:bg-gray-50 text-blue-600 text-lg font-medium py-3 px-8 rounded-lg border-2 border-blue-600 transition-colors">
                Sign In
              </button>
            </SignInButton>
          </div>
        </div>

        {/* Features */}
        <div className="mt-24 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="text-3xl mb-4">📧</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Campaign Management</h3>
            <p className="text-gray-600">Create, schedule, and manage email campaigns with our intuitive interface.</p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="text-3xl mb-4">👥</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Contact Management</h3>
            <p className="text-gray-600">Organize your contacts with tags, segments, and smart filtering.</p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="text-3xl mb-4">📊</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Advanced Analytics</h3>
            <p className="text-gray-600">Track opens, clicks, and conversions with detailed reporting.</p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="text-3xl mb-4">📝</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Template Library</h3>
            <p className="text-gray-600">Use professional templates or create your own custom designs.</p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="text-3xl mb-4">⚡</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Automation</h3>
            <p className="text-gray-600">Set up automated email sequences and drip campaigns.</p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="text-3xl mb-4">🎯</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Personalization</h3>
            <p className="text-gray-600">Personalize emails with dynamic content and smart targeting.</p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-24 bg-blue-600 rounded-lg px-8 py-12 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to grow your business?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of businesses using SmartBatch to reach their customers.
          </p>
          <SignUpButton mode="modal">
            <button className="bg-white hover:bg-gray-100 text-blue-600 text-lg font-medium py-3 px-8 rounded-lg transition-colors">
              Get Started for Free
            </button>
          </SignUpButton>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>&copy; 2025 SmartBatch Email. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
