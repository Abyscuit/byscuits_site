import fs from 'fs';
import path from 'path';

export interface FileMetadata {
  id: string;
  name: string;
  path: string; // relative path (e.g., '', 'Test', 'Test/Subfolder')
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

class FileMetadataManager {
  private metadataDir: string;
  private permissionsDir: string;

  constructor() {
    this.metadataDir = path.join(process.cwd(), 'data', 'file-metadata');
    this.permissionsDir = path.join(process.cwd(), 'data', 'file-permissions');
    this.ensureDirectories();
  }

  private ensureDirectories() {
    if (!fs.existsSync(this.metadataDir)) {
      fs.mkdirSync(this.metadataDir, { recursive: true });
    }
    if (!fs.existsSync(this.permissionsDir)) {
      fs.mkdirSync(this.permissionsDir, { recursive: true });
    }
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  generateShareToken(): string {
    return Math.random().toString(36).substr(2, 15);
  }

  async createFileMetadata(
    name: string,
    owner: string,
    filePath: string,
    isPublic: boolean = false,
    relPath: string = ''
  ): Promise<FileMetadata> {
    const stats = fs.statSync(filePath);
    const metadata: FileMetadata = {
      id: this.generateId(),
      name,
      path: relPath,
      owner,
      isPublic,
      shareToken: isPublic ? this.generateShareToken() : undefined,
      createdAt: new Date().toISOString(),
      lastModified: stats.mtime.toISOString(),
      size: stats.size,
      type: stats.isDirectory() ? 'folder' : 'file',
      mimeType: stats.isFile() ? this.getMimeType(name) : undefined,
    };

    const metadataPath = path.join(this.metadataDir, `${metadata.id}.json`);
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
    
    return metadata;
  }

  async getFileMetadata(fileId: string): Promise<FileMetadata | null> {
    const metadataPath = path.join(this.metadataDir, `${fileId}.json`);
    if (!fs.existsSync(metadataPath)) {
      return null;
    }
    
    const content = fs.readFileSync(metadataPath, 'utf-8');
    return JSON.parse(content);
  }

  async getFileMetadataByName(name: string, owner: string, relPath: string = ''): Promise<FileMetadata | null> {
    const files = fs.readdirSync(this.metadataDir);
    for (const file of files) {
      if (file.endsWith('.json')) {
        const content = fs.readFileSync(path.join(this.metadataDir, file), 'utf-8');
        const metadata: FileMetadata = JSON.parse(content);
        if (metadata.name === name && metadata.owner === owner && metadata.path === relPath) {
          return metadata;
        }
      }
    }
    return null;
  }

  async updateFileMetadata(fileId: string, updates: Partial<FileMetadata>): Promise<FileMetadata | null> {
    const metadata = await this.getFileMetadata(fileId);
    if (!metadata) return null;

    const updatedMetadata = { ...metadata, ...updates };
    const metadataPath = path.join(this.metadataDir, `${fileId}.json`);
    fs.writeFileSync(metadataPath, JSON.stringify(updatedMetadata, null, 2));
    
    return updatedMetadata;
  }

  async deleteFileMetadata(fileId: string): Promise<boolean> {
    const metadataPath = path.join(this.metadataDir, `${fileId}.json`);
    if (fs.existsSync(metadataPath)) {
      fs.unlinkSync(metadataPath);
      return true;
    }
    return false;
  }

  async deleteFileMetadataByName(name: string, owner: string, relPath: string = ''): Promise<boolean> {
    const files = fs.readdirSync(this.metadataDir);
    for (const file of files) {
      if (file.endsWith('.json')) {
        const content = fs.readFileSync(path.join(this.metadataDir, file), 'utf-8');
        const metadata: FileMetadata = JSON.parse(content);
        if (metadata.name === name && metadata.owner === owner && metadata.path === relPath) {
          fs.unlinkSync(path.join(this.metadataDir, file));
          return true;
        }
      }
    }
    return false;
  }

  async getUserFiles(owner: string): Promise<FileMetadata[]> {
    const files = fs.readdirSync(this.metadataDir);
    const userFiles: FileMetadata[] = [];
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        const content = fs.readFileSync(path.join(this.metadataDir, file), 'utf-8');
        const metadata: FileMetadata = JSON.parse(content);
        if (metadata.owner === owner) {
          userFiles.push(metadata);
        }
      }
    }
    
    return userFiles.sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());
  }

  async getPublicFiles(): Promise<FileMetadata[]> {
    const files = fs.readdirSync(this.metadataDir);
    const publicFiles: FileMetadata[] = [];
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        const content = fs.readFileSync(path.join(this.metadataDir, file), 'utf-8');
        const metadata: FileMetadata = JSON.parse(content);
        if (metadata.isPublic) {
          publicFiles.push(metadata);
        }
      }
    }
    
    return publicFiles.sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());
  }

  async getFileByShareToken(shareToken: string): Promise<FileMetadata | null> {
    const files = fs.readdirSync(this.metadataDir);
    for (const file of files) {
      if (file.endsWith('.json')) {
        const content = fs.readFileSync(path.join(this.metadataDir, file), 'utf-8');
        const metadata: FileMetadata = JSON.parse(content);
        if (metadata.shareToken === shareToken && metadata.isPublic) {
          return metadata;
        }
      }
    }
    return null;
  }

  async checkFileAccess(fileId: string, userId: string): Promise<boolean> {
    const metadata = await this.getFileMetadata(fileId);
    if (!metadata) return false;
    
    // Owner has full access
    if (metadata.owner === userId) return true;
    
    // Public files are readable by everyone
    if (metadata.isPublic) return true;
    
    // Check explicit permissions
    const permissions = await this.getFilePermissions(fileId);
    return permissions.some(p => p.userId === userId && p.permission === 'read');
  }

  async checkFileWriteAccess(fileId: string, userId: string): Promise<boolean> {
    const metadata = await this.getFileMetadata(fileId);
    if (!metadata) return false;
    
    // Owner has full access
    if (metadata.owner === userId) return true;
    
    // Check explicit write permissions
    const permissions = await this.getFilePermissions(fileId);
    return permissions.some(p => p.userId === userId && (p.permission === 'write' || p.permission === 'admin'));
  }

  async grantPermission(fileId: string, userId: string, permission: 'read' | 'write' | 'admin'): Promise<void> {
    const permissionData: FilePermission = {
      userId,
      fileId,
      permission,
      grantedAt: new Date().toISOString(),
    };

    const permissionPath = path.join(this.permissionsDir, `${fileId}_${userId}.json`);
    fs.writeFileSync(permissionPath, JSON.stringify(permissionData, null, 2));
  }

  async revokePermission(fileId: string, userId: string): Promise<void> {
    const permissionPath = path.join(this.permissionsDir, `${fileId}_${userId}.json`);
    if (fs.existsSync(permissionPath)) {
      fs.unlinkSync(permissionPath);
    }
  }

  async getFilePermissions(fileId: string): Promise<FilePermission[]> {
    const files = fs.readdirSync(this.permissionsDir);
    const permissions: FilePermission[] = [];
    
    for (const file of files) {
      if (file.startsWith(fileId) && file.endsWith('.json')) {
        const content = fs.readFileSync(path.join(this.permissionsDir, file), 'utf-8');
        const permission: FilePermission = JSON.parse(content);
        permissions.push(permission);
      }
    }
    
    return permissions;
  }

  async getUserFilesInPath(owner: string, relPath: string): Promise<FileMetadata[]> {
    const userDir = path.join(process.cwd(), 'uploads', owner, relPath);
    if (!fs.existsSync(userDir)) return [];
    const items = fs.readdirSync(userDir, { withFileTypes: true });
    const results: FileMetadata[] = [];
    for (const item of items) {
      const itemPath = path.join(userDir, item.name);
      const stats = fs.statSync(itemPath);
      results.push({
        id: '', // Not using metadata id for folder navigation
        name: item.name,
        owner,
        isPublic: false, // Not using metadata for folder navigation
        shareToken: undefined,
        createdAt: stats.birthtime.toISOString(),
        lastModified: stats.mtime.toISOString(),
        size: stats.size,
        type: item.isDirectory() ? 'folder' : 'file',
        mimeType: !item.isDirectory() ? this.getMimeType(item.name) : undefined,
      });
    }
    // Sort folders first, then files, both alphabetically
    return results.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  }

  async deleteAllMetadataInPath(owner: string, relPath: string): Promise<number> {
    const files = fs.readdirSync(this.metadataDir);
    let deleted = 0;
    for (const file of files) {
      if (file.endsWith('.json')) {
        const content = fs.readFileSync(path.join(this.metadataDir, file), 'utf-8');
        const metadata: FileMetadata = JSON.parse(content);
        if (metadata.owner === owner && (metadata.path === relPath || metadata.path.startsWith(relPath + '/'))) {
          fs.unlinkSync(path.join(this.metadataDir, file));
          deleted++;
        }
      }
    }
    return deleted;
  }

  private getMimeType(filename: string): string {
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.txt': 'text/plain',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.mp4': 'video/mp4',
      '.mp3': 'audio/mpeg',
      '.zip': 'application/zip',
      '.rar': 'application/x-rar-compressed',
      '.exe': 'application/x-msdownload',
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }
}

export const fileMetadataManager = new FileMetadataManager(); 