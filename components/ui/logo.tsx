"use client";

import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface LogoProps {
  /** Show the company name text next to the logo */
  showText?: boolean;
  /** Size variant of the logo */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Link to navigate to when clicked (default: /dashboard) */
  href?: string;
  /** Additional CSS classes */
  className?: string;
  /** Text variant to show */
  textVariant?: 'full' | 'short';
  /** Disable link wrapper */
  noLink?: boolean;
}

const sizeClasses = {
  sm: 'h-6 w-6',
  md: 'h-8 w-8', 
  lg: 'h-12 w-12',
  xl: 'h-16 w-16'
};

const textSizeClasses = {
  sm: 'text-lg',
  md: 'text-xl',
  lg: 'text-2xl', 
  xl: 'text-3xl'
};

export function Logo({ 
  showText = true, 
  size = 'md', 
  href = '/dashboard',
  className,
  textVariant = 'full',
  noLink = false
}: LogoProps) {
  const logoContent = (
    <div className={cn("flex items-center space-x-2", className)}>
      <div className={cn("relative flex-shrink-0", sizeClasses[size])}>
        <Image
          src="/logo.svg"
          alt="SmartBatch Logo"
          fill
          className="object-contain"
          priority
        />
      </div>
      {showText && (
        <span className={cn(
          "font-bold text-gray-900 dark:text-white",
          textSizeClasses[size]
        )}>
          {textVariant === 'full' ? 'SmartBatch' : 'SB'}
        </span>
      )}
    </div>
  );

  if (noLink) {
    return logoContent;
  }

  return (
    <Link href={href} className="block">
      {logoContent}
    </Link>
  );
}
