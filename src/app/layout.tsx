import MainNav from '@/components/main-nav';
import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import ClientProviders from './ClientProviders';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: "Da Byscuit's",
  description: "Da Byscuit's Official Website",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang='en'
      className='dark'>
      <body className={inter.className}>
        <ClientProviders>
          <MainNav />
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
