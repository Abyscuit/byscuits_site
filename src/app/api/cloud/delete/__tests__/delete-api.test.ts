import request from 'supertest';
import fs from 'fs';
import path from 'path';
import { FileMetadataManager } from '@/lib/file-metadata';
import { createServer } from 'http';
import { DELETE } from '../route';
import { NextRequest } from 'next/server';

describe('/api/cloud/delete API', () => {
  const testOwner = 'e2euser@example.com';
  const testDir = path.join(process.cwd(), 'uploads', testOwner, 'Subfolder');
  const testFile = path.join(testDir, 'delete-me.txt');
  let server: any;

  beforeAll(async () => {
    fs.mkdirSync(testDir, { recursive: true });
    fs.writeFileSync(testFile, 'delete me');
    // Create metadata
    const manager = new FileMetadataManager();
    await manager.createFileMetadata('delete-me.txt', testOwner, testFile, false, 'Subfolder');
    // Mock Next.js API route as an HTTP server for supertest
    server = createServer(async (req, res) => {
      // Patch session for test
      (req as any).session = {
        user: {
          email: testOwner,
          name: 'E2E User',
          guilds: ['1257795491232616629'],
          guildRoles: ['1257811218106810462'],
        },
      };
      // Patch getServerSession to always return our test session
      const originalGetServerSession = require('next-auth').getServerSession;
      require('next-auth').getServerSession = async () => (req as any).session;
      // Call the handler
      const url = `/api/cloud/delete?name=delete-me.txt&path=Subfolder&type=file`;
      req.url = url;
      // Create a minimal NextRequest mock
      const nextReq = Object.assign(new NextRequest('http://localhost:4001' + req.url), req);
      const response = await DELETE(nextReq);
      res.statusCode = response.status;
      res.end(JSON.stringify(await response.json()));
      // Restore
      require('next-auth').getServerSession = originalGetServerSession;
    });
    await new Promise(resolve => server.listen(4001, resolve));
  });

  afterAll(async () => {
    server.close();
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

  it('deletes a file in a subfolder and returns 200', async () => {
    const res = await request('http://localhost:4001')
      .delete('/api/cloud/delete?name=delete-me.txt&path=Subfolder&type=file');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('returns 404 for missing file', async () => {
    const res = await request('http://localhost:4001')
      .delete('/api/cloud/delete?name=notfound.txt&path=Subfolder&type=file');
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/not found/i);
  });
}); 