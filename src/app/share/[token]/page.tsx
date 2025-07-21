'use client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileMetadata } from '@/lib/file-metadata';

interface SharePageProps {
  params: {
    token: string;
  };
}

export default function SharePage({ params }: SharePageProps) {
  const [fileMetadata, setFileMetadata] = useState<FileMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFileInfo = async () => {
      try {
        const res = await fetch(`/api/cloud/share/public?token=${params.token}`);
        if (res.ok) {
          const data = await res.json();
          setFileMetadata(data.file);
        } else {
          setError('File not found or access denied');
        }
      } catch (err) {
        setError('Failed to load file information');
      } finally {
        setLoading(false);
      }
    };

    fetchFileInfo();
  }, [params.token]);

  const handleDownload = async () => {
    if (!fileMetadata) return;
    
    try {
      const res = await fetch(`/api/cloud/download?name=${encodeURIComponent(fileMetadata.name)}&token=${params.token}`);
      if (!res.ok) throw new Error('Download failed');
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileMetadata.name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Download failed');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl mb-4">Loading...</div>
        </div>
      </main>
    );
  }

  if (error || !fileMetadata) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold mb-2">File Not Found</h1>
          <p className="text-muted-foreground">{error || 'The requested file could not be found.'}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-card rounded-lg border shadow-sm p-8">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">📁</div>
              <h1 className="text-3xl font-bold mb-2">Shared File</h1>
              <p className="text-muted-foreground">This file has been shared with you</p>
            </div>

            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4">
                <h2 className="font-semibold mb-2">File Information</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name:</span>
                    <span className="font-medium">{fileMetadata.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type:</span>
                    <span className="font-medium">{fileMetadata.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Size:</span>
                    <span className="font-medium">{formatFileSize(fileMetadata.size)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shared:</span>
                    <span className="font-medium">{new Date(fileMetadata.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                <Button onClick={handleDownload} size="lg">
                  <span className="mr-2">📥</span>
                  Download File
                </Button>
              </div>

              <div className="text-center text-sm text-muted-foreground">
                <p>This file was shared by {fileMetadata.owner}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 