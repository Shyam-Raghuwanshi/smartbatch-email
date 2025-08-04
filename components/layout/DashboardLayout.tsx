"use client";

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import TopNav from './TopNav';
import { EmailSetupPrompt } from '@/components/email-setup-prompt';
import { AuthErrorBoundary } from '@/components/auth-error-boundary';

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
}

export default function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const pathname = usePathname();
  
  // Auto-generate title from pathname if not provided
  const getPageTitle = () => {
    if (title) return title;
    
    const pathSegments = pathname.split('/').filter(Boolean);
    const lastSegment = pathSegments[pathSegments.length - 1];
    
    if (!lastSegment || lastSegment === 'dashboard') return 'Dashboard';
    
    // Capitalize first letter and handle plural forms
    return lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1);
  };

  return (
    <AuthErrorBoundary>
      <div className="h-full">
        {/* Email Setup Prompt */}
        <EmailSetupPrompt />
        
        {/* Sidebar */}
        <Sidebar />

        {/* Main content area */}
        <div className="lg:pl-72">
          {/* Top navigation */}
          <TopNav title={getPageTitle()} />

          {/* Page content */}
          <main className="py-10">
            <div className="px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </AuthErrorBoundary>
  );
}
