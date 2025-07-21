import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { fileMetadataManager } from '@/lib/file-metadata';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const name = searchParams.get('name');
  if (!name) {
    return NextResponse.json({ error: 'No file specified' }, { status: 400 });
  }

  // Get file metadata
  const fileMetadata = await fileMetadataManager.getFileMetadataByName(name, session.user.email);
  if (!fileMetadata) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  // Check if user has write access (only owner can delete)
  const hasWriteAccess = await fileMetadataManager.checkFileWriteAccess(fileMetadata.id, session.user.email);
  if (!hasWriteAccess) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  const filePath = path.join(process.cwd(), 'uploads', session.user.email, name);
  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }
  
  try {
    // Check if it's a directory and remove recursively if so
    const stats = fs.statSync(filePath);
    if (stats.isDirectory()) {
      fs.rmSync(filePath, { recursive: true, force: true });
    } else {
      fs.unlinkSync(filePath);
    }
    
    // Delete metadata
    await fileMetadataManager.deleteFileMetadata(fileMetadata.id);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 });
  }
} 