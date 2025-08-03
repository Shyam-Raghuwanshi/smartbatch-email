import { SignUp } from '@clerk/nextjs'
import { Logo } from '@/components/ui/logo'

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="flex flex-col items-center">
          <div className="mb-6">
            <Logo size="xl" href="/" />
          </div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            Join SmartBatch
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Start your email marketing journey today
          </p>
        </div>
        <div className="flex justify-center">
          <SignUp 
            appearance={{
              elements: {
                formButtonPrimary: 
                  "bg-blue-600 hover:bg-blue-700 text-sm normal-case",
              },
            }}
          />
        </div>
      </div>
    </div>
  )
}
