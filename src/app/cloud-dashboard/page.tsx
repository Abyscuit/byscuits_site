'use client';
import Link from 'next/link';

export default function CloudDashboard() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-2 py-4 md:p-24">
      <div className="space-y-6 p-8 bg-secondary/25 rounded-lg w-full max-w-lg flex flex-col items-center">
        <h1 className="text-3xl font-bold mb-4 text-center">Cloud Dashboard</h1>
        <p className="text-center text-muted-foreground mb-6">Manage your cloud files here. Upload new files or view your stored files.</p>
        <div className="flex gap-4 w-full justify-center">
          <Link href="/cloud-dashboard/upload">
            <button className="bg-indigo-600 text-white px-6 py-3 rounded font-semibold shadow hover:bg-indigo-700 transition-colors w-full">Upload Files</button>
          </Link>
          <Link href="/cloud-dashboard/files">
            <button className="bg-gray-700 text-white px-6 py-3 rounded font-semibold shadow hover:bg-gray-800 transition-colors w-full">View Files</button>
          </Link>
        </div>
      </div>
    </main>
  );
} 