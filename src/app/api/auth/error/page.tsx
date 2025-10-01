'use client';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Suspense } from 'react';

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  const getErrorMessage = (errorCode: string | null) => {
    switch (errorCode) {
    case 'Callback':
      return 'Sign in was cancelled or failed. Please try again.';
    case 'AccessDenied':
      return 'Access was denied. Please try again.';
    case 'Verification':
      return 'Verification failed. Please try again.';
    case 'Configuration':
      return 'There is a problem with the server configuration.';
    case 'OAuthSignin':
      return 'Error occurred during sign in.';
    case 'OAuthCallback':
      return 'Error occurred during the callback.';
    case 'OAuthCreateAccount':
      return 'Could not create OAuth provider user.';
    case 'EmailCreateAccount':
      return 'Could not create email provider user.';
    case 'Callback':
      return 'Error occurred during the callback.';
    case 'OAuthAccountNotLinked':
      return 'Email on the account already exists with different provider.';
    case 'EmailSignin':
      return 'Check your email address.';
    case 'CredentialsSignin':
      return 'Sign in failed. Check the details you provided are correct.';
    case 'SessionRequired':
      return 'Please sign in to access this page.';
    default:
      return 'An error occurred during authentication. Please try again.';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="flex min-h-screen flex-col items-center justify-center p-2 py-4 md:px-24">
        <div className="space-y-6 p-8 bg-secondary/25 rounded-lg w-full max-w-lg flex flex-col items-center">
          <div className="text-center">
            <div className="text-6xl mb-4">❌</div>
            <h1 className="text-2xl font-bold mb-4 text-center">Authentication Error</h1>
            <p className="text-muted-foreground mb-6">
              {getErrorMessage(error)}
            </p>
          </div>
          
          <div className="flex flex-col gap-3 w-full">
            <Link href="/">
              <Button className="w-full">
                Go to Home
              </Button>
            </Link>
            
            <Link href={callbackUrl}>
              <Button variant="outline" className="w-full">
                Go Back
              </Button>
            </Link>
            
            <Link href="/ai">
              <Button variant="outline" className="w-full">
                Try AI Chat
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background">
        <main className="flex min-h-screen flex-col items-center justify-center p-2 py-4 md:px-24">
          <div className="text-center">
            <div className="text-2xl mb-4">Loading...</div>
          </div>
        </main>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  );
} 