import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { storageManager } from '@/lib/storage-manager';

export const runtime = 'nodejs';

// Simple admin check - you might want to implement proper admin roles
const isAdmin = (email: string): boolean => {
  // Add your admin emails here
  const adminEmails = [process.env.ADMIN_EMAIL || 'your-admin-email@example.com'];
  return adminEmails.includes(email);
};

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isAdmin(session.user.email)) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  try {
    const allStorage = await storageManager.getAllUserStorage();
    const formattedStorage = allStorage.map(storage => ({
      ...storage,
      usedFormatted: storageManager.formatBytes(storage.usedBytes),
      limitFormatted: storageManager.formatBytes(storage.limitBytes),
      usagePercentage: (storage.usedBytes / storage.limitBytes) * 100,
    }));

    return NextResponse.json({
      success: true,
      users: formattedStorage,
      defaultLimit: storageManager.getDefaultLimit(),
      defaultLimitFormatted: storageManager.formatBytes(storageManager.getDefaultLimit()),
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get user storage' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isAdmin(session.user.email)) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  try {
    const { userId, limitGB } = await req.json();
    
    if (!userId || typeof limitGB !== 'number' || limitGB <= 0) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    const limitBytes = limitGB * 1024 * 1024 * 1024; // Convert GB to bytes
    const updatedStorage = await storageManager.updateUserStorageLimit(userId, limitBytes);
    
    return NextResponse.json({
      success: true,
      storage: {
        ...updatedStorage,
        limitFormatted: storageManager.formatBytes(updatedStorage.limitBytes),
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update user storage limit' }, { status: 500 });
  }
} 