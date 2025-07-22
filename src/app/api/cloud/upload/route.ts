import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { fileMetadataManager } from '@/lib/file-metadata';
import { storageManager } from '@/lib/storage-manager';
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

  const formData = await req.formData();
  const files = formData.getAll('file');
  const isPublic = formData.get('isPublic') === 'true';
  const relPath = formData.get('path')?.toString() || '';
  
  if (!files.length) {
    return NextResponse.json({ error: 'No files uploaded' }, { status: 400 });
  }

  const userDir = path.join(process.cwd(), 'uploads', session.user.email, relPath);
  if (!fs.existsSync(userDir)) fs.mkdirSync(userDir, { recursive: true });

  const savedFiles = [];
  for (const file of files) {
    if (typeof file === 'string') continue;
    
    // Check if file already exists
    const existingMetadata = await fileMetadataManager.getFileMetadataByName(file.name, session.user.email);
    if (existingMetadata) {
      return NextResponse.json({ error: `File "${file.name}" already exists` }, { status: 409 });
    }
    
    // Check storage limit before uploading
    const fileSize = file.size;
    const storageCheck = await storageManager.checkStorageLimit(session.user.email, fileSize);
    if (!storageCheck.allowed) {
      return NextResponse.json({ 
        error: `Storage limit exceeded. You have ${storageManager.formatBytes(storageCheck.currentUsage)} used of ${storageManager.formatBytes(storageCheck.limit)} limit.` 
      }, { status: 413 });
    }
    
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const filePath = path.join(userDir, file.name);
    fs.writeFileSync(filePath, new Uint8Array(buffer));
    
    // Create metadata for the file
    await fileMetadataManager.createFileMetadata(file.name, session.user.email, filePath, isPublic);
    savedFiles.push(file.name);
  }

  return NextResponse.json({ success: true, files: savedFiles });
} 