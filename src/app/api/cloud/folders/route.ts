import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { fileMetadataManager } from '@/lib/file-metadata';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, isPublic = false, path: relPath = '' } = await request.json();
    
    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Folder name is required' }, { status: 400 });
    }

    // Sanitize folder name
    const sanitizedName = name.replace(/[^a-zA-Z0-9-_]/g, '_');
    
    // Create user-specific directory
    const userDir = path.join(process.cwd(), 'uploads', session.user.email, relPath);
    const folderPath = path.join(userDir, sanitizedName);
    
    // Ensure user directory exists
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }
    
    // Check if folder already exists
    if (fs.existsSync(folderPath)) {
      return NextResponse.json({ error: 'Folder already exists' }, { status: 409 });
    }
    
    // Create the folder
    fs.mkdirSync(folderPath, { recursive: true });
    
    // Create metadata for the folder
    await fileMetadataManager.createFileMetadata(sanitizedName, session.user.email, folderPath, isPublic);
    
    return NextResponse.json({ success: true, folderName: sanitizedName });
  } catch (error) {
    // Error logging removed for linter compliance
    return NextResponse.json({ error: 'Failed to create folder' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userDir = path.join(process.cwd(), 'uploads', session.user.email);
    
    if (!fs.existsSync(userDir)) {
      return NextResponse.json({ folders: [] });
    }

    const items = fs.readdirSync(userDir, { withFileTypes: true });
    const folders = items
      .filter(item => item.isDirectory())
      .map(folder => ({
        name: folder.name,
        type: 'folder' as const,
        size: 0,
        lastModified: fs.statSync(path.join(userDir, folder.name)).mtime.toISOString()
      }));

    return NextResponse.json({ folders });
  } catch (error) {
    // Error logging removed for linter compliance
    return NextResponse.json({ error: 'Failed to fetch folders' }, { status: 500 });
  }
} 