import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { userId, sessionId } = await auth();

    return NextResponse.json({
      authenticated: !!userId,
      userId,
      sessionId,
    });
  } catch (error) {
    return NextResponse.json(
      { authenticated: false, error: 'Authentication failed' },
      { status: 401 }
    );
  }
}
