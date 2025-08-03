import { Logo } from '@/components/ui/logo';

interface EmailHeaderProps {
  /** Size variant for the logo */
  logoSize?: 'sm' | 'md' | 'lg';
  /** Header background color */
  backgroundColor?: string;
  /** Show navigation links */
  showNavigation?: boolean;
  /** Custom header content */
  children?: React.ReactNode;
  /** Header style variant */
  variant?: 'simple' | 'navigation' | 'banner';
}

export function EmailHeader({ 
  logoSize = 'md',
  backgroundColor = 'bg-white',
  showNavigation = false,
  children,
  variant = 'simple'
}: EmailHeaderProps) {
  
  if (variant === 'banner') {
    return (
      <div className={`${backgroundColor} border-b border-gray-200`}>
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="text-center">
            <Logo size={logoSize} showText={true} noLink={true} />
            {children}
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'navigation') {
    return (
      <div className={`${backgroundColor} border-b border-gray-200`}>
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Logo size={logoSize} showText={true} noLink={true} />
            {showNavigation && (
              <nav className="space-x-4 text-sm">
                <a href="#" className="text-gray-600 hover:text-gray-900">Home</a>
                <a href="#" className="text-gray-600 hover:text-gray-900">Products</a>
                <a href="#" className="text-gray-600 hover:text-gray-900">Contact</a>
              </nav>
            )}
            {children}
          </div>
        </div>
      </div>
    );
  }

  // Simple variant (default)
  return (
    <div className={`${backgroundColor} border-b border-gray-200`}>
      <div className="max-w-2xl mx-auto px-4 py-4">
        <div className="flex items-center">
          <Logo size={logoSize} showText={true} noLink={true} />
          {children}
        </div>
      </div>
    </div>
  );
}
