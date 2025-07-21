import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { fileMetadataManager } from '@/lib/file-metadata';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get('name');
  const shareToken = searchParams.get('token');
  
  if (!name) {
    return NextResponse.json({ error: 'No file specified' }, { status: 400 });
  }

  let fileMetadata = null;
  let filePath = '';

  if (shareToken) {
    // Public access via share token
    fileMetadata = await fileMetadataManager.getFileByShareToken(shareToken);
    if (!fileMetadata || fileMetadata.name !== name) {
      return NextResponse.json({ error: 'Invalid share token or file not found' }, { status: 404 });
    }
    filePath = path.join(process.cwd(), 'uploads', fileMetadata.owner, name);
  } else {
    // Authenticated access
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    fileMetadata = await fileMetadataManager.getFileMetadataByName(name, session.user.email);
    if (!fileMetadata) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Check if user has access to this file
    const hasAccess = await fileMetadataManager.checkFileAccess(fileMetadata.id, session.user.email);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    filePath = path.join(process.cwd(), 'uploads', session.user.email, name);
  }

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  const fileBuffer = fs.readFileSync(filePath);
  const contentType = fileMetadata?.mimeType || 'application/octet-stream';
  
  return new NextResponse(fileBuffer, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${name}"`,
    },
  });
} 