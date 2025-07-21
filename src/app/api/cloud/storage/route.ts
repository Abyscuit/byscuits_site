import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { storageManager } from '@/lib/storage-manager';

export const runtime = 'nodejs';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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