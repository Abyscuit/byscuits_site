'use client';
import { useEffect, useState } from 'react';
import { useSession, signIn } from 'next-auth/react';
import type { CloudFile } from './types';

export default function CloudFiles() {
  const { data: session, status } = useSession();
  const [files, setFiles] = useState<CloudFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    fetch('/api/cloud/files')
      .then(res => res.json())
      .then(data => {
        setFiles(data.files || []);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load files');
        setLoading(false);
      });
  }, [session]);

  if (status === 'loading') return <div>Loading...</div>;
  if (!session) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-2 py-4 md:p-24">
        <div className="space-y-6 p-8 bg-secondary/25 rounded-lg w-full max-w-lg flex flex-col items-center">
          <h1 className="text-2xl font-bold mb-4 text-center">Login Required</h1>
          <button
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
            onClick={() => signIn('discord')}
          >
            Login with Discord
          </button>
        </div>
      </main>
    );
  }

  async function handleDownload(name: string) {
    const res = await fetch(`/api/cloud/download?name=${encodeURIComponent(name)}`);
    if (!res.ok) return alert('Download failed');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  }

  async function handleDelete(name: string) {
    setDeleting(name);
    const res = await fetch(`/api/cloud/delete?name=${encodeURIComponent(name)}`, { method: 'DELETE' });
    setDeleting(null);
    if (res.ok) {
      setFiles(files => files.filter(f => f.name !== name));
    } else {
      alert('Delete failed');
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-2 py-4 md:p-24">
      <div className="space-y-6 p-8 bg-secondary/25 rounded-lg w-full max-w-lg flex flex-col items-center">
        <h1 className="text-2xl font-bold mb-4 text-center">Your Files</h1>
        {loading ? (
          <div>Loading files...</div>
        ) : error ? (
          <div className="text-red-600">{error}</div>
        ) : files.length === 0 ? (
          <div>No files found.</div>
        ) : (
          <ul className="w-full divide-y divide-gray-200">
            {files.map(file => (
              <li key={file.name} className="flex justify-between items-center py-2">
                <span>{file.name} <span className="text-gray-500 text-xs">({(file.size/1024).toFixed(1)} KB)</span></span>
                <div className="flex gap-2">
                  <button
                    className="bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700 text-sm"
                    onClick={() => handleDownload(file.name)}
                  >
                    Download
                  </button>
                  <button
                    className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 text-sm"
                    onClick={() => handleDelete(file.name)}
                    disabled={deleting === file.name}
                  >
                    {deleting === file.name ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
} 