'use client';

import * as React from 'react';
import Link from 'next/link';
import { useSession, signOut, signIn } from "next-auth/react";

// import { cn } from '@/lib/utils';
// import { Icons } from '@/components/icons';
import {
  NavigationMenu,
  // NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  // NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';

export default function MainNav() {
  const { data: session } = useSession();
  
  // Check if user is admin
  const isAdmin = (email: string): boolean => {
    const adminEmails = [process.env.ADMIN_EMAIL || 'your-admin-email@example.com'];
    return adminEmails.includes(email);
  };
  
  return (
    <header className='flex items-center justify-between p-3'>
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <Link
              href='/'
              legacyBehavior
              passHref>
              <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                Home
              </NavigationMenuLink>
            </Link>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Link
              href='/ai'
              legacyBehavior
              passHref>
              <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                AI
              </NavigationMenuLink>
            </Link>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Link
              href='/cloud-dashboard'
              legacyBehavior
              passHref>
              <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                Cloud Dashboard
              </NavigationMenuLink>
            </Link>
          </NavigationMenuItem>
          {session?.user?.email && isAdmin(session.user.email) && (
            <NavigationMenuItem>
              <Link
                href='/admin/storage'
                legacyBehavior
                passHref>
                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                  Admin
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
          )}
          {!session && (
            <NavigationMenuItem>
              <button
                className={navigationMenuTriggerStyle()}
                onClick={() => signIn('discord')}
              >
                Login
              </button>
            </NavigationMenuItem>
          )}
        </NavigationMenuList>
      </NavigationMenu>
      {session && session.user && (
        <div className="flex items-center gap-2">
          {session.user.image && (
            <img src={session.user.image} alt="avatar" className="w-8 h-8 rounded-full" />
          )}
          <span className="text-sm font-medium">{session.user.name}</span>
          <button
            className="px-3 py-1 bg-blue-900 rounded hover:bg-blue-950 text-sm transition-colors"
            onClick={() => signOut()}
          >
            Sign out
          </button>
        </div>
      )}
    </header>
  );
}
