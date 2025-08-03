import { Logo } from '@/components/ui/logo';

interface EmailBrandingProps {
  /** Size variant for the logo */
  size?: 'sm' | 'md' | 'lg';
  /** Show company address */
  showAddress?: boolean;
  /** Show unsubscribe link */
  showUnsubscribe?: boolean;
  /** Custom footer text */
  footerText?: string;
  /** Email context (campaign, template, etc.) */
  context?: string;
}

export function EmailBranding({ 
  size = 'sm', 
  showAddress = true, 
  showUnsubscribe = true,
  footerText,
  context = 'email'
}: EmailBrandingProps) {
  return (
    <div className="bg-gray-50 border-t border-gray-200 py-6 px-4 text-center">
      {/* Logo */}
      <div className="mb-4 flex justify-center">
        <Logo size={size} showText={true} noLink={true} />
      </div>
      
      {/* Custom footer text */}
      {footerText && (
        <p className="text-sm text-gray-600 mb-4">
          {footerText}
        </p>
      )}
      
      {/* Company info */}
      {showAddress && (
        <div className="text-xs text-gray-500 mb-4">
          <p>SmartBatch Email Marketing</p>
          <p>123 Business Ave, Suite 100</p>
          <p>Business City, BC 12345</p>
        </div>
      )}
      
      {/* Legal and unsubscribe */}
      <div className="text-xs text-gray-500 space-y-2">
        {showUnsubscribe && (
          <p>
            You received this {context} because you subscribed to our mailing list.{' '}
            <a href="#unsubscribe" className="text-blue-600 hover:text-blue-800 underline">
              Unsubscribe
            </a>
          </p>
        )}
        
        <p>
          © {new Date().getFullYear()} SmartBatch. All rights reserved.
        </p>
        
        <p className="text-gray-400">
          Powered by{' '}
          <span className="font-medium text-gray-500">SmartBatch</span>
        </p>
      </div>
    </div>
  );
}
