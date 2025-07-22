import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { fileMetadataManager, FileMetadata } from '@/lib/file-metadata';

export const runtime = 'nodejs';

const REQUIRED_GUILD_ID = '1257795491232616629';
function isInRequiredGuild(session: any): boolean {
  return Array.isArray(session?.user?.guilds) && session.user.guilds.includes(REQUIRED_GUILD_ID);
}

const ALLOWED_ROLE_IDS = [
  '1257811218106810462', // Premium Byscuit
  '1257798871652896849', // Da Crew
  '1257833372105838776', // IRL
  '1263487124745879553', // Sub Mod
  '1257797484542038046', // Moderator
  '1257797305680003082', // Admin
];
function hasAllowedRole(session: any): boolean {
  const roles = Array.isArray(session?.user?.guildRoles) ? session.user.guildRoles : [];
  return roles.some((roleId: string) => ALLOWED_ROLE_IDS.includes(roleId));
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!isInRequiredGuild(session)) {
    return NextResponse.json({ error: 'You must be a member of the Da Byscuits Discord server.' }, { status: 403 });
  }
  if (!hasAllowedRole(session)) {
    return NextResponse.json({ error: 'You must have a special role in the Da Byscuits Discord server.' }, { status: 403 });
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
  if (!isInRequiredGuild(session)) {
    return NextResponse.json({ error: 'You must be a member of the Da Byscuits Discord server.' }, { status: 403 });
  }
  if (!hasAllowedRole(session)) {
    return NextResponse.json({ error: 'You must have a special role in the Da Byscuits Discord server.' }, { status: 403 });
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