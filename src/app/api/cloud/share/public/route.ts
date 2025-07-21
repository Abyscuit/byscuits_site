import { NextRequest, NextResponse } from 'next/server';
import { fileMetadataManager } from '@/lib/file-metadata';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');
    
    if (!token) {
      return NextResponse.json({ error: 'Share token is required' }, { status: 400 });
    }

    // Get file metadata by share token
    const fileMetadata = await fileMetadataManager.getFileByShareToken(token);
    if (!fileMetadata) {
      return NextResponse.json({ error: 'File not found or access denied' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      file: fileMetadata
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get file information' }, { status: 500 });
  }
} 