import { Logo } from '@/components/ui/logo';

interface LoadingScreenProps {
  /** Custom loading message */
  message?: string;
  /** Logo size */
  logoSize?: 'sm' | 'md' | 'lg' | 'xl';
  /** Show animated spinner */
  showSpinner?: boolean;
}

export function LoadingScreen({ 
  message = 'Loading...', 
  logoSize = 'lg',
  showSpinner = true 
}: LoadingScreenProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="mb-8">
          <Logo size={logoSize} noLink={true} className="justify-center" />
        </div>
        
        {showSpinner && (
          <div className="mb-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        )}
        
        <p className="text-gray-600 text-lg">{message}</p>
      </div>
    </div>
  );
}
