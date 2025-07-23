export interface FileMetadata {
  id: string;
  name: string;
  path: string;
  owner: string;
  isPublic: boolean;
  shareToken?: string;
  createdAt: string;
  lastModified: string;
  size: number;
  type: 'file' | 'folder';
  mimeType?: string;
}

export interface FilePermission {
  userId: string;
  fileId: string;
  permission: 'read' | 'write' | 'admin';
  grantedAt: string;
}

export interface UserStorage {
  userId: string;
  usedBytes: number;
  limitBytes: number;
  lastUpdated: string;
}

export interface StorageStats {
  totalFiles: number;
  totalFolders: number;
  usedBytes: number;
  limitBytes: number;
  usagePercentage: number;
} 