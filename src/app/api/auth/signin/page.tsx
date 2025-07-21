'use client';
import { useSearchParams } from 'next/navigation';
import { useSession, signIn } from 'next-auth/react';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function SignInPage() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  // Redirect if already signed in
  useEffect(() => {
    if (session && status === 'authenticated') {
      window.location.href = callbackUrl;
    }
  }, [session, status, callbackUrl]);

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
    case 'OAuthAccountNotLinked':
      return 'Email on the account already exists with different provider.';
    case 'EmailSignin':
      return 'Check your email address.';
    case 'CredentialsSignin':
      return 'Sign in failed. Check the details you provided are correct.';
    case 'SessionRequired':
      return 'Please sign in to access this page.';
    default:
      return null;
    }
  };

  const errorMessage = getErrorMessage(error);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-background">
        <main className="flex min-h-screen flex-col items-center justify-center p-2 py-4 md:px-24">
          <div className="text-center">
            <div className="text-2xl mb-4">Loading...</div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="flex min-h-screen flex-col items-center justify-center p-2 py-4 md:px-24">
        <div className="space-y-6 p-8 bg-secondary/25 rounded-lg w-full max-w-lg flex flex-col items-center">
          <div className="text-center">
            <div className="text-6xl mb-4">🔐</div>
            <h1 className="text-2xl font-bold mb-4 text-center">Sign In Required</h1>
            <p className="text-muted-foreground mb-6">
              Please sign in to access this page.
            </p>
            
            {errorMessage && (
              <div className="mb-6 p-3 bg-red-100 border border-red-300 rounded text-red-700">
                {errorMessage}
              </div>
            )}
          </div>
          
          <div className="flex flex-col gap-3 w-full">
            <Button 
              onClick={() => signIn('discord', { callbackUrl })}
              className="w-full"
            >
              Sign in with Discord
            </Button>
            
            <Link href="/">
              <Button variant="outline" className="w-full">
                Go to Home
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