'use client';
import { useEffect, useState, useRef } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Dialog as ConfirmDialog, DialogContent as ConfirmDialogContent, DialogHeader as ConfirmDialogHeader, DialogTitle as ConfirmDialogTitle, DialogTrigger as ConfirmDialogTrigger } from '@/components/ui/dialog';
import type { FileItem, StorageStats } from './types';

export default function CloudDashboard() {
  const { data: session, status } = useSession();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [isPublicUpload, setIsPublicUpload] = useState(false);
  const [isPublicFolder, setIsPublicFolder] = useState(false);
  const [selectedFileForSharing, setSelectedFileForSharing] = useState<FileItem | null>(null);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [storageStats, setStorageStats] = useState<StorageStats | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ name: string } | null>(null);
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const fileExplorerRef = useRef<HTMLDivElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const uploadErrorRef = useRef<HTMLDivElement>(null);
  const [folderToDeleteContents, setFolderToDeleteContents] = useState<FileItem[] | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!session) return;
    setLoading(true);
    fetchFiles(currentPath);
    fetchStorageStats();
  }, [currentPath, session]);

  useEffect(() => {
    if (uploadError && uploadErrorRef.current) {
      uploadErrorRef.current.focus();
    }
  }, [uploadError]);

  useEffect(() => {
    if (toast) {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = setTimeout(() => setToast(null), 3000);
    }
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, [toast]);

  const fetchStorageStats = async () => {
    try {
      const res = await fetch('/api/cloud/storage');
      if (res.ok) {
        const data = await res.json();
        setStorageStats(data.stats);
      }
    } catch (err) {
      // Storage stats fetch failed, but don't break the main functionality
    }
  };

  const fetchFiles = async (pathArr = currentPath) => {
    try {
      const relPath = pathArr.join('/');
      const res = await fetch(`/api/cloud/files?path=${encodeURIComponent(relPath)}`);
      const data = await res.json();
      setFiles(data.files || []);
      setLoading(false);
    } catch (err) {
      setError('Failed to load files');
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedFiles) return;
    setUploading(true);
    setUploadError(null);
    const formData = new FormData();
    Array.from(selectedFiles).forEach(file => formData.append('file', file));
    formData.append('isPublic', isPublicUpload.toString());
    formData.append('path', currentPath.join('/'));
    
    try {
      const res = await fetch('/api/cloud/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (res.ok) {
        setSelectedFiles(null);
        setIsPublicUpload(false);
        setShowUploadDialog(false);
        setUploadError(null); // auto-clear error after success
        fetchFiles();
      } else {
        const data = await res.json();
        if (res.status === 409) {
          setUploadError(data.error || 'A file with this name already exists in this folder.');
        } else {
          setUploadError(data.error || 'Upload failed');
        }
      }
    } catch (err) {
      setUploadError('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (name: string) => {
    try {
      const res = await fetch(`/api/cloud/download?name=${encodeURIComponent(name)}`);
      if (!res.ok) throw new Error('Download failed');
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Download failed');
    }
  };

  const handleDelete = async (name: string, type: 'file' | 'folder' = 'file') => {
    setDeleting(name);
    try {
      const relPath = currentPath.join('/');
      const res = await fetch(`/api/cloud/delete?name=${encodeURIComponent(name)}&path=${encodeURIComponent(relPath)}&type=${type}`, { method: 'DELETE' });
      if (res.ok) {
        setFiles(files => files.filter(f => f.name !== name));
        setToast({ message: `${type === 'folder' ? 'Folder' : 'File'} "${name}" deleted successfully.`, type: 'success' });
      } else {
        setToast({ message: 'Delete failed', type: 'error' });
        alert('Delete failed');
      }
    } catch (err) {
      setToast({ message: 'Delete failed', type: 'error' });
      alert('Delete failed');
    } finally {
      setDeleting(null);
      setConfirmDelete(null);
      setFolderToDeleteContents(null);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    
    try {
      const res = await fetch('/api/cloud/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newFolderName, isPublic: isPublicFolder, path: currentPath.join('/') }),
      });
      
      if (res.ok) {
        setNewFolderName('');
        setIsPublicFolder(false);
        setShowNewFolderDialog(false);
        fetchFiles();
      } else {
        alert('Failed to create folder');
      }
    } catch (err) {
      alert('Failed to create folder');
    }
  };

  const handleShareFile = async (file: FileItem) => {
    setSelectedFileForSharing(file);
    setShowShareDialog(true);
    
    try {
      const res = await fetch(`/api/cloud/share?name=${encodeURIComponent(file.name)}`);
      if (res.ok) {
        const data = await res.json();
        setShareUrl(data.shareUrl || '');
      }
    } catch (err) {
      setShareUrl('');
    }
  };

  const handleToggleSharing = async (file: FileItem, isPublic: boolean) => {
    try {
      const res = await fetch('/api/cloud/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name, isPublic }),
      });
      
      if (res.ok) {
        const data = await res.json();
        setShareUrl(data.shareUrl || '');
        fetchFiles();
      } else {
        alert('Failed to update sharing settings');
      }
    } catch (err) {
      alert('Failed to update sharing settings');
    }
  };

  // Navigation helpers
  const handleOpenFolder = (folderName: string) => {
    const newPath = [...currentPath, folderName];
    setCurrentPath(newPath);
  };
  const handleBack = () => {
    if (currentPath.length === 0) return;
    const newPath = currentPath.slice(0, -1);
    setCurrentPath(newPath);
  };

  // Breadcrumb navigation
  const handleBreadcrumbClick = (idx: number) => {
    const newPath = currentPath.slice(0, idx);
    setCurrentPath(newPath);
  };

  // Drag-and-drop upload handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      setSelectedFiles(files);
      setShowUploadDialog(true);
      setUploadError(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileName: string, type: 'file' | 'folder') => {
    if (type === 'folder') return '📁';
    
    const extension = fileName.split('.').pop()?.toLowerCase();
    const iconMap: { [key: string]: string } = {
      pdf: '📄',
      doc: '📄',
      docx: '📄',
      txt: '📄',
      jpg: '🖼️',
      jpeg: '🖼️',
      png: '🖼️',
      gif: '🖼️',
      mp4: '🎥',
      mp3: '🎵',
      zip: '📦',
      rar: '📦',
      exe: '⚙️',
    };
    return iconMap[extension || ''] || '📄';
  };

  const REQUIRED_GUILD_ID = '1257795491232616629';
  const ALLOWED_ROLE_IDS = [
    '1257811218106810462', // Premium Byscuit
    '1257798871652896849', // Da Crew
    '1257833372105838776', // IRL
    '1263487124745879553', // Sub Mod
    '1257797484542038046', // Moderator
    '1257797305680003082', // Admin
  ];

  if (status === 'loading') return <div>Loading...</div>;
  if (!session) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-2 py-4 md:p-24">
        <div className="space-y-6 p-8 bg-secondary/25 rounded-lg w-full max-w-lg flex flex-col items-center">
          <h1 className="text-2xl font-bold mb-4 text-center">Login Required</h1>
          <Button onClick={() => signIn('discord')}>
            Login with Discord
          </Button>
        </div>
      </main>
    );
  }

  if (!session?.user || !Array.isArray((session.user as any).guilds) || !(session.user as any).guilds.includes(REQUIRED_GUILD_ID)) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-2 py-4 md:p-24">
        <div className="space-y-6 p-8 bg-secondary/25 rounded-lg w-full max-w-lg flex flex-col items-center">
          <h1 className="text-2xl font-bold mb-4 text-center">Discord Membership Required</h1>
          <p className="text-center text-muted-foreground mb-6">
            You must be a member of the Da Byscuits Discord server to use cloud storage.<br/>
            <a href={atob("aHR0cHM6Ly9kaXNjb3JkLmdnL2J5c2N1aXRz")} target="_blank" rel="noopener noreferrer" className="underline text-primary">Join the server here</a> and then sign in again.
          </p>
          <Button onClick={() => signIn('discord')}>
            Re-check Membership
          </Button>
        </div>
      </main>
    );
  }

  const userRoles: string[] = Array.isArray((session.user as any).guildRoles) ? (session.user as any).guildRoles : [];
  const hasAllowedRole = userRoles.some(roleId => ALLOWED_ROLE_IDS.includes(roleId));
  if (!hasAllowedRole) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-2 py-4 md:p-24">
        <div className="space-y-6 p-8 bg-secondary/25 rounded-lg w-full max-w-lg flex flex-col items-center">
          <h1 className="text-2xl font-bold mb-4 text-center">Insufficient Discord Role</h1>
          <p className="text-center text-muted-foreground mb-6">
            You must have a special role in the Da Byscuits Discord server to use cloud storage.<br/>
            <a href={atob("aHR0cHM6Ly9kaXNjb3JkLmdnL2J5c2N1aXRz")} target="_blank" rel="noopener noreferrer" className="underline text-primary">Join the server here</a> and contact an admin if you need access.
          </p>
          <Button onClick={() => signIn('discord')}>
            Re-check Membership
          </Button>
        </div>
      </main>
    );
  }

  const handleDeleteClick = async (file: FileItem) => {
    if (file.type === 'folder') {
      // Fetch contents of the folder to check if it's empty
      const relPath = [...currentPath, file.name].join('/');
      try {
        const res = await fetch(`/api/cloud/files?path=${encodeURIComponent(relPath)}`);
        const data = await res.json();
        setFolderToDeleteContents(data.files || []);
      } catch {
        setFolderToDeleteContents(null);
      }
    } else {
      setFolderToDeleteContents(null);
    }
    setConfirmDelete({ name: file.name });
  };

  return (
    <main className="min-h-screen bg-background">
      {toast && (
        <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded shadow-lg text-white transition-opacity duration-300 ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}
          role="alert">
          {toast.message}
        </div>
      )}
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Cloud Storage</h1>
            <p className="text-muted-foreground">Manage your files and folders</p>
            {storageStats && (
              <div className="mt-2 flex items-center space-x-4 text-sm">
                <span className="text-muted-foreground">
                  {storageStats.totalFiles} files, {storageStats.totalFolders} folders
                </span>
                <div className="flex items-center space-x-2">
                  <span className="text-muted-foreground">Storage:</span>
                  <span className="font-medium">{storageStats.usedFormatted} / {storageStats.limitFormatted}</span>
                  <div className="w-20 bg-muted rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        storageStats.usagePercentage >= 90 ? 'bg-red-500' :
                          storageStats.usagePercentage >= 75 ? 'bg-yellow-500' :
                            storageStats.usagePercentage >= 50 ? 'bg-orange-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(storageStats.usagePercentage, 100)}%` }}
                    />
                  </div>
                  <span className={`text-xs font-medium ${
                    storageStats.usagePercentage >= 90 ? 'text-red-600' :
                      storageStats.usagePercentage >= 75 ? 'text-yellow-600' :
                        storageStats.usagePercentage >= 50 ? 'text-orange-600' : 'text-green-600'
                  }`}>
                    {storageStats.usagePercentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex gap-3">
            {/* New Folder Button */}
            <Dialog open={showNewFolderDialog} onOpenChange={setShowNewFolderDialog}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <span className="mr-2">📁</span>
                  New Folder
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Folder</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="folder-name">Folder Name</Label>
                    <Input
                      id="folder-name"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      placeholder="Enter folder name"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="public-folder"
                      checked={isPublicFolder}
                      onChange={(e) => setIsPublicFolder(e.target.checked)}
                    />
                    <Label htmlFor="public-folder">Make folder public (shareable)</Label>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowNewFolderDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateFolder}>
                      Create Folder
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Share Dialog */}
            <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Share File</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {selectedFileForSharing && (
                    <>
                      <div>
                        <Label>File: {selectedFileForSharing.name}</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="public-share"
                          checked={selectedFileForSharing.isPublic}
                          onChange={(e) => handleToggleSharing(selectedFileForSharing, e.target.checked)}
                        />
                        <Label htmlFor="public-share">Make file public (shareable)</Label>
                      </div>
                      {selectedFileForSharing.isPublic && shareUrl && (
                        <div>
                          <Label>Share URL:</Label>
                          <div className="flex gap-2 mt-1">
                            <Input value={shareUrl} readOnly />
                            <Button
                              variant="outline"
                              onClick={() => navigator.clipboard.writeText(shareUrl)}
                            >
                              Copy
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  <div className="flex justify-end">
                    <Button variant="outline" onClick={() => setShowShareDialog(false)}>
                      Close
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Upload Button */}
            <Dialog open={showUploadDialog} onOpenChange={(open) => { setShowUploadDialog(open); if (!open) setUploadError(null); }}>
              <DialogTrigger asChild>
                <Button>
                  <span className="mr-2">📤</span>
                  Upload Files
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload Files</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="text-xs text-muted-foreground">
                    Upload target: <span className="font-mono">/{currentPath.join('/') || ''}</span>
                  </div>
                  <div>
                    <Label htmlFor="file-upload">Select Files</Label>
                    <Input
                      id="file-upload"
                      type="file"
                      multiple
                      onChange={(e) => { setSelectedFiles(e.target.files); setUploadError(null); }}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="public-upload"
                      checked={isPublicUpload}
                      onChange={(e) => setIsPublicUpload(e.target.checked)}
                    />
                    <Label htmlFor="public-upload">Make files public (shareable)</Label>
                  </div>
                  {selectedFiles && (
                    <div className="max-h-32 overflow-y-auto">
                      <Label>Selected Files:</Label>
                      <ul className="text-sm text-muted-foreground mt-1">
                        {Array.from(selectedFiles).map(file => (
                          <li key={file.name}>{file.name}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {uploadError && <div ref={uploadErrorRef} tabIndex={-1} className="text-red-600 text-sm" aria-live="assertive">{uploadError}</div>}
                  <div className="flex justify-end gap-2">
                    <Button 
                      onClick={handleUpload}
                      disabled={!selectedFiles || selectedFiles.length === 0 || uploading}
                    >
                      {uploading ? 'Uploading...' : 'Upload'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* File Explorer */}
        <div
          ref={fileExplorerRef}
          className={`bg-card rounded-lg border shadow-sm ${dragActive ? 'ring-2 ring-primary' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Files & Folders</h2>
            <div className="flex items-center mb-4 gap-2">
              {currentPath.length > 0 && (
                <Button variant="ghost" size="icon" onClick={handleBack} title="Back">
                  ←
                </Button>
              )}
              <span className="text-muted-foreground text-sm flex items-center gap-1">
                <Button variant="link" size="sm" onClick={() => handleBreadcrumbClick(0)} className="px-1 py-0 h-auto">Root</Button>
                {currentPath.map((segment, idx) => (
                  <span key={idx} className="flex items-center gap-1">
                    /
                    <Button
                      variant="link"
                      size="sm"
                      className="px-1 py-0 h-auto"
                      onClick={() => handleBreadcrumbClick(idx + 1)}
                    >
                      {segment}
                    </Button>
                  </span>
                ))}
              </span>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-muted-foreground">Loading files...</div>
              </div>
            ) : error ? (
              <div className="text-red-600 text-center py-8">{error}</div>
            ) : files.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📁</div>
                <h3 className="text-lg font-medium mb-2">No files yet</h3>
                <p className="text-muted-foreground">Upload your first file to get started</p>
              </div>
            ) : (
              <div className="space-y-2">
                {files.map(file => (
                  <div
                    key={file.name}
                    className={`flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg transition-colors ${deleting === file.name ? 'opacity-50 transition-opacity duration-500' : ''}`}
                    onDoubleClick={file.type === 'folder' ? () => handleOpenFolder(file.name) : undefined}
                    style={{ cursor: 'default' }}
                  >
                    <div className="flex items-center space-x-3">
                      <span
                        className={`text-2xl ${file.type === 'folder' ? 'cursor-pointer' : ''}`}
                        onClick={file.type === 'folder' ? () => handleOpenFolder(file.name) : undefined}
                        title={file.type === 'folder' ? 'Open folder' : undefined}
                      >
                        {getFileIcon(file.name, file.type)}
                      </span>
                      <div
                        className={`font-medium ${file.type === 'folder' ? 'cursor-pointer' : ''}`}
                        onClick={file.type === 'folder' ? () => handleOpenFolder(file.name) : undefined}
                        title={file.type === 'folder' ? 'Open folder' : undefined}
                      >
                        {file.name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {file.type === 'file' ? formatFileSize(file.size) : 'Folder'}
                        {file.lastModified && ` • Modified ${new Date(file.lastModified).toLocaleDateString()}`}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleShareFile(file)}
                      >
                        {file.isPublic ? '🔗' : '🔒'} Share
                      </Button>
                      {file.type === 'file' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(file.name)}
                        >
                          Download
                        </Button>
                      )}
                      <ConfirmDialog open={!!confirmDelete && confirmDelete.name === file.name} onOpenChange={open => { if (!open) { setConfirmDelete(null); setFolderToDeleteContents(null); } }}>
                        <ConfirmDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteClick(file)}
                            disabled={deleting === file.name}
                          >
                            {deleting === file.name ? 'Deleting...' : 'Delete'}
                          </Button>
                        </ConfirmDialogTrigger>
                        <ConfirmDialogContent>
                          <ConfirmDialogHeader>
                            <ConfirmDialogTitle>Confirm Delete</ConfirmDialogTitle>
                          </ConfirmDialogHeader>
                          <div className="py-4">
                            Are you sure you want to delete <span className="font-semibold">{file.name}</span>? This action cannot be undone.
                            {file.type === 'folder' && folderToDeleteContents && (
                              <div className="mt-2 text-red-600 text-sm font-medium">
                                {folderToDeleteContents.length === 0 ? (
                                  <>This folder is empty.</>
                                ) : (
                                  <>
                                    Warning: This folder contains <b>{folderToDeleteContents.filter(f => f.type === 'file').length}</b> file(s) and <b>{folderToDeleteContents.filter(f => f.type === 'folder').length}</b> subfolder(s).<br/>
                                    The first few items:
                                    <ul className="list-disc pl-6 mt-1">
                                      {folderToDeleteContents.slice(0, 3).map(item => (
                                        <li key={item.name}>{item.type === 'folder' ? '📁' : '📄'} {item.name}</li>
                                      ))}
                                      {folderToDeleteContents.length > 3 && <li>...and {folderToDeleteContents.length - 3} more</li>}
                                    </ul>
                                    <span className="block mt-1">All files and subfolders will be permanently deleted!</span>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => { setConfirmDelete(null); setFolderToDeleteContents(null); }}>
                              Cancel
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={() => handleDelete(file.name, file.type)}
                              disabled={deleting === file.name}
                            >
                              {deleting === file.name ? (
                                <span className="flex items-center gap-2"><span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span> Deleting...</span>
                              ) : 'Delete'}
                            </Button>
                          </div>
                        </ConfirmDialogContent>
                      </ConfirmDialog>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
} 