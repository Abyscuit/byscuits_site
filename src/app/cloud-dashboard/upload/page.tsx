'use client';
import { useState } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function CloudUpload() {
  const { data: session, status } = useSession();
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

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

  async function handleUpload() {
    if (!selectedFiles) return;
    setUploading(true);
    setError(null);
    const formData = new FormData();
    Array.from(selectedFiles).forEach(file => formData.append('file', file));
    const res = await fetch('/api/cloud/upload', {
      method: 'POST',
      body: formData,
    });
    setUploading(false);
    if (res.ok) {
      router.push('/cloud-dashboard/files');
    } else {
      const data = await res.json();
      setError(data.error || 'Upload failed');
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-2 py-4 md:p-24">
      <div className="space-y-6 p-8 bg-secondary/25 rounded-lg w-full max-w-lg flex flex-col items-center">
        <h1 className="text-2xl font-bold mb-4 text-center">Upload Files</h1>
        <input
          type="file"
          multiple
          className="mb-4 w-full"
          onChange={e => setSelectedFiles(e.target.files)}
        />
        {selectedFiles && (
          <ul className="mb-4 w-full text-sm text-gray-700">
            {Array.from(selectedFiles).map(file => (
              <li key={file.name}>{file.name}</li>
            ))}
          </ul>
        )}
        {error && <div className="text-red-600 mb-2">{error}</div>}
        <button
          className="bg-indigo-600 text-white px-6 py-3 rounded font-semibold shadow hover:bg-indigo-700 transition-colors w-full"
          disabled={!selectedFiles || selectedFiles.length === 0 || uploading}
          onClick={handleUpload}
        >
          {uploading ? 'Uploading...' : 'Upload'}
        </button>
      </div>
    </main>
  );
} 