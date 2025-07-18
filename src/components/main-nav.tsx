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
  return (
    <header className='flex flex-col items-center justify-between p-3'>
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
                Use AI
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
          <NavigationMenuItem>
            <Link
              href='https://discord.gg/byscuits'
              legacyBehavior
              passHref>
              <NavigationMenuLink className={navigationMenuTriggerStyle()} 
                target='_blank'
                rel="noopener noreferrer">
                Discord
              </NavigationMenuLink>
            </Link>
          </NavigationMenuItem>
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
        <div className="flex items-center gap-2 mt-2">
          {session.user.image && (
            <img src={session.user.image} alt="avatar" className="w-8 h-8 rounded-full" />
          )}
          <span>{session.user.name}</span>
          <button
            className="ml-2 px-2 pb-2 pt-1 bg-blue-900 rounded hover:bg-blue-950"
            onClick={() => signOut()}
          >
            Sign out
          </button>
        </div>
      )}
    </header>
  );
}
