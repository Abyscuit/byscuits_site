import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { fileMetadataManager } from '@/lib/file-metadata';
import fs from 'fs';
import path from 'path';

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

export async function POST(request: NextRequest) {
  try {
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
    if (!isInRequiredGuild(session)) {
      return NextResponse.json({ error: 'You must be a member of the Da Byscuits Discord server.' }, { status: 403 });
    }
    if (!hasAllowedRole(session)) {
      return NextResponse.json({ error: 'You must have a special role in the Da Byscuits Discord server.' }, { status: 403 });
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