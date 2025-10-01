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

export async function DELETE(req: NextRequest) {
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

  const { searchParams } = new URL(req.url);
  const name = searchParams.get('name');
  const relPath = searchParams.get('path') || '';
  const type = searchParams.get('type') || 'file';
  if (!name) return NextResponse.json({ error: 'No file specified' }, { status: 400 });
  const filePath = path.join(config.getUploadsDir(), session.user.email, relPath, name);

  // Get file metadata
  const fileMetadata = await fileMetadataManager.getFileMetadataByName(name, session.user.email, relPath);
  if (!fileMetadata) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  // Check if user has write access (only owner can delete)
  const hasWriteAccess = await fileMetadataManager.checkFileWriteAccess(fileMetadata.id, session.user.email);
  if (!hasWriteAccess) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }
  
  try {
    if (type === 'folder') {
      logger.info(`Deleting folder: ${filePath}`);
      fs.rmSync(filePath, { recursive: true, force: true });
      // Recursively delete all metadata for this folder and its contents
      await fileMetadataManager.deleteAllMetadataInPath(session.user.email, path.join(relPath, name));
    } else {
      logger.info(`Deleting file: ${filePath}`);
      fs.unlinkSync(filePath);
      await fileMetadataManager.deleteFileMetadataByName(name, session.user.email, relPath);
    }
    logger.info(`Successfully deleted ${type}: ${name}`);
    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error(`Error deleting ${type} ${name}:`, err);
    return NextResponse.json({ 
      error: 'Failed to delete item',
      details: config.isProduction() ? undefined : String(err)
    }, { status: 500 });
  }
} 