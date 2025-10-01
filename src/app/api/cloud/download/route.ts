import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { fileMetadataManager } from '@/lib/file-metadata';
import { config } from '@/lib/config';
import { logger } from '@/lib/logger';
import fs from 'fs';
import path from 'path';

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
    filePath = path.join(config.getUploadsDir(), fileMetadata.owner, name);
  } else {
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
    fileMetadata = await fileMetadataManager.getFileMetadataByName(name, session.user.email);
    if (!fileMetadata) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
    // Check if user has access to this file
    const hasAccess = await fileMetadataManager.checkFileAccess(fileMetadata.id, session.user.email);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    filePath = path.join(config.getUploadsDir(), session.user.email, name);
  }

  if (!fs.existsSync(filePath)) {
    logger.error(`File not found at path: ${filePath}`);
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  try {
    const fileBuffer = fs.readFileSync(filePath);
    const contentType = fileMetadata?.mimeType || 'application/octet-stream';
    
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(name)}"`,
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    logger.error(`Error reading file ${filePath}:`, error);
    return NextResponse.json({ error: 'Failed to read file' }, { status: 500 });
  }
} 