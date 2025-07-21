'use client';
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';

export default function CallbackPage() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'authenticated' && session) {
      // Redirect to home page after successful authentication
      window.location.href = '/';
    }
  }, [session, status]);

  return (
    <div className="min-h-screen bg-background">
      <main className="flex min-h-screen flex-col items-center justify-center p-2 py-4 md:px-24">
        <div className="space-y-6 p-8 bg-secondary/25 rounded-lg w-full max-w-lg flex flex-col items-center">
          <div className="text-center">
            <div className="text-6xl mb-4">⏳</div>
            <h1 className="text-2xl font-bold mb-4 text-center">Completing Sign In</h1>
            <p className="text-muted-foreground mb-6">
              Please wait while we complete your authentication...
            </p>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          </div>
        </div>
      </main>
    </div>
  );
} 