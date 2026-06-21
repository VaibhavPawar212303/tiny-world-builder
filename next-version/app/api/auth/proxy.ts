import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { userId, sessionId } = await auth();

    return NextResponse.json({
      authenticated: !!userId,
      userId,
      sessionId,
    });
  } catch (error) {
    return NextResponse.json(
      { authenticated: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }
}

export const runtime = 'nodejs';
