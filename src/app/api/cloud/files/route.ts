import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const uploadDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadDir)) return NextResponse.json({ files: [] });
  const files = fs.readdirSync(uploadDir).map(name => {
    const stats = fs.statSync(path.join(uploadDir, name));
    return { name, size: stats.size };
  });
  return NextResponse.json({ files });
} 