'use client';

import React from 'react';

export default function Footer() {
  return (
    <footer className='flex flex-col items-center justify-between p-3'>
      <p className='text-sm leading-none text-muted-foreground max-w-full'>
        Abyscuit - &copy; {new Date().getFullYear()}
      </p>
    </footer>
  );
}
