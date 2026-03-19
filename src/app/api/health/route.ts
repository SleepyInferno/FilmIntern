import { NextResponse } from 'next/server';
import { APP_VERSION } from '@/lib/version';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { db } = await import('@/lib/db');
    // Lightweight connectivity check -- if this throws, DB is unreachable
    db.listProjects();

    return NextResponse.json({
      status: 'ok',
      version: APP_VERSION,
      db: 'connected',
    });
  } catch {
    return NextResponse.json(
      { status: 'error', db: 'failed' },
      { status: 503 },
    );
  }
}
