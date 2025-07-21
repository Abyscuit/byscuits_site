import fs from 'fs';
import path from 'path';

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

class StorageManager {
  private storageDir: string;
  private defaultLimitBytes = 15 * 1024 * 1024 * 1024; // 15GB

  constructor() {
    this.storageDir = path.join(process.cwd(), 'data', 'user-storage');
    this.ensureDirectory();
  }

  private ensureDirectory() {
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }
  }

  private getUserStoragePath(userId: string): string {
    return path.join(this.storageDir, `${userId}.json`);
  }

  private getUserFilesPath(userId: string): string {
    return path.join(process.cwd(), 'uploads', userId);
  }

  async getUserStorage(userId: string): Promise<UserStorage> {
    const storagePath = this.getUserStoragePath(userId);
    
    if (fs.existsSync(storagePath)) {
      const content = fs.readFileSync(storagePath, 'utf-8');
      return JSON.parse(content);
    }

    // Create default storage record
    const defaultStorage: UserStorage = {
      userId,
      usedBytes: 0,
      limitBytes: this.defaultLimitBytes,
      lastUpdated: new Date().toISOString(),
    };

    await this.saveUserStorage(defaultStorage);
    return defaultStorage;
  }

  async saveUserStorage(storage: UserStorage): Promise<void> {
    const storagePath = this.getUserStoragePath(storage.userId);
    fs.writeFileSync(storagePath, JSON.stringify(storage, null, 2));
  }

  async updateUserStorageLimit(userId: string, limitBytes: number): Promise<UserStorage> {
    const storage = await this.getUserStorage(userId);
    storage.limitBytes = limitBytes;
    storage.lastUpdated = new Date().toISOString();
    await this.saveUserStorage(storage);
    return storage;
  }

  async calculateUserStorage(userId: string): Promise<StorageStats> {
    const userDir = this.getUserFilesPath(userId);
    const storage = await this.getUserStorage(userId);
    
    if (!fs.existsSync(userDir)) {
      return {
        totalFiles: 0,
        totalFolders: 0,
        usedBytes: 0,
        limitBytes: storage.limitBytes,
        usagePercentage: 0,
      };
    }

    let totalBytes = 0;
    let totalFiles = 0;
    let totalFolders = 0;

    const calculateDirectorySize = (dirPath: string): void => {
      const items = fs.readdirSync(dirPath, { withFileTypes: true });
      
      for (const item of items) {
        const itemPath = path.join(dirPath, item.name);
        
        if (item.isDirectory()) {
          totalFolders++;
          calculateDirectorySize(itemPath);
        } else {
          totalFiles++;
          const stats = fs.statSync(itemPath);
          totalBytes += stats.size;
        }
      }
    };

    calculateDirectorySize(userDir);

    // Update storage record
    storage.usedBytes = totalBytes;
    storage.lastUpdated = new Date().toISOString();
    await this.saveUserStorage(storage);

    return {
      totalFiles,
      totalFolders,
      usedBytes: totalBytes,
      limitBytes: storage.limitBytes,
      usagePercentage: (totalBytes / storage.limitBytes) * 100,
    };
  }

  async checkStorageLimit(userId: string, fileSize: number): Promise<{ allowed: boolean; currentUsage: number; limit: number }> {
    const stats = await this.calculateUserStorage(userId);
    const wouldExceed = stats.usedBytes + fileSize > stats.limitBytes;
    
    return {
      allowed: !wouldExceed,
      currentUsage: stats.usedBytes,
      limit: stats.limitBytes,
    };
  }

  async getAllUserStorage(): Promise<UserStorage[]> {
    if (!fs.existsSync(this.storageDir)) {
      return [];
    }

    const files = fs.readdirSync(this.storageDir);
    const storageRecords: UserStorage[] = [];

    for (const file of files) {
      if (file.endsWith('.json')) {
        const content = fs.readFileSync(path.join(this.storageDir, file), 'utf-8');
        storageRecords.push(JSON.parse(content));
      }
    }

    return storageRecords.sort((a, b) => 
      new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
    );
  }

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getDefaultLimit(): number {
    return this.defaultLimitBytes;
  }
}

export const storageManager = new StorageManager(); 