export interface FileItem {
  id: string;
  name: string;
  size: number;
  type: 'file' | 'folder';
  lastModified?: string;
  isPublic: boolean;
  shareToken?: string;
  owner: string;
  mimeType?: string;
}

export interface StorageStats {
  usedBytes: number;
  limitBytes: number;
  usedFormatted: string;
  limitFormatted: string;
  usagePercentage: number;
  totalFiles: number;
  totalFolders: number;
} 