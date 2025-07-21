import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { fileMetadataManager, FileMetadata } from '@/lib/file-metadata';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { fileName, isPublic } = await req.json();
    
    if (!fileName || typeof fileName !== 'string') {
      return NextResponse.json({ error: 'File name is required' }, { status: 400 });
    }

    if (typeof isPublic !== 'boolean') {
      return NextResponse.json({ error: 'isPublic must be a boolean' }, { status: 400 });
    }

    // Get file metadata
    const fileMetadata = await fileMetadataManager.getFileMetadataByName(fileName, session.user.email);
    if (!fileMetadata) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Update sharing settings
    const updates: Partial<FileMetadata> = {
      isPublic,
    };
    
    if (isPublic) {
      // Generate a new share token if making public and doesn't have one
      updates.shareToken = fileMetadata.shareToken || fileMetadataManager.generateShareToken();
    } else {
      // Remove share token if making private
      updates.shareToken = undefined;
    }
    
    const updatedMetadata = await fileMetadataManager.updateFileMetadata(fileMetadata.id, updates);

    if (!updatedMetadata) {
      return NextResponse.json({ error: 'Failed to update file settings' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      file: updatedMetadata,
      shareUrl: isPublic ? `${process.env.NEXTAUTH_URL}/api/cloud/download?name=${encodeURIComponent(fileName)}&token=${updatedMetadata.shareToken}` : null
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update sharing settings' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const fileName = searchParams.get('name');
    
    if (!fileName) {
      return NextResponse.json({ error: 'File name is required' }, { status: 400 });
    }

    // Get file metadata
    const fileMetadata = await fileMetadataManager.getFileMetadataByName(fileName, session.user.email);
    if (!fileMetadata) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      file: fileMetadata,
      shareUrl: fileMetadata.isPublic ? `${process.env.NEXTAUTH_URL}/api/cloud/download?name=${encodeURIComponent(fileName)}&token=${fileMetadata.shareToken}` : null
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get sharing settings' }, { status: 500 });
  }
} 