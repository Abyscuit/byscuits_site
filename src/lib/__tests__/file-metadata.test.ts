import fs from 'fs';
import path from 'path';
import { FileMetadataManager } from '../file-metadata';

describe('FileMetadataManager', () => {
  const manager = new FileMetadataManager();
  const testOwner = 'test@example.com';
  const testDir = path.join(process.cwd(), 'uploads', testOwner, 'TestFolder');
  const testFile = path.join(testDir, 'test.txt');

  beforeAll(() => {
    fs.mkdirSync(testDir, { recursive: true });
    fs.writeFileSync(testFile, 'hello world');
  });

  afterAll(() => {
    fs.rmSync(path.join(process.cwd(), 'uploads', testOwner), { recursive: true, force: true });
    // Clean up metadata
    const metaDir = path.join(process.cwd(), 'data', 'file-metadata');
    fs.readdirSync(metaDir).forEach(f => {
      if (f.endsWith('.json')) {
        const content = fs.readFileSync(path.join(metaDir, f), 'utf-8');
        if (content.includes(testOwner)) fs.unlinkSync(path.join(metaDir, f));
      }
    });
  });

  it('creates and retrieves file metadata in a subfolder', async () => {
    const meta = await manager.createFileMetadata('test.txt', testOwner, testFile, false, 'TestFolder');
    expect(meta).toBeDefined();
    const found = await manager.getFileMetadataByName('test.txt', testOwner, 'TestFolder');
    expect(found).not.toBeNull();
    expect(found?.name).toBe('test.txt');
    expect(found?.path).toBe('TestFolder');
  });

  it('deletes file metadata by name and path', async () => {
    await manager.deleteFileMetadataByName('test.txt', testOwner, 'TestFolder');
    const found = await manager.getFileMetadataByName('test.txt', testOwner, 'TestFolder');
    expect(found).toBeNull();
  });
}); 