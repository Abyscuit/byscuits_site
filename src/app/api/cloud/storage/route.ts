import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { storageManager } from '@/lib/storage-manager';

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

export async function GET() {
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
    const stats = await storageManager.calculateUserStorage(session.user.email);
    return NextResponse.json({
      success: true,
      stats: {
        ...stats,
        usedFormatted: storageManager.formatBytes(stats.usedBytes),
        limitFormatted: storageManager.formatBytes(stats.limitBytes),
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get storage stats' }, { status: 500 });
  }
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
    const { limitGB } = await req.json();
    
    if (typeof limitGB !== 'number' || limitGB <= 0) {
      return NextResponse.json({ error: 'Invalid limit value' }, { status: 400 });
    }

    const limitBytes = limitGB * 1024 * 1024 * 1024; // Convert GB to bytes
    const updatedStorage = await storageManager.updateUserStorageLimit(session.user.email, limitBytes);
    
    return NextResponse.json({
      success: true,
      storage: {
        ...updatedStorage,
        limitFormatted: storageManager.formatBytes(updatedStorage.limitBytes),
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update storage limit' }, { status: 500 });
  }
} 