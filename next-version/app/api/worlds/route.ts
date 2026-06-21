import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { query } from '@/app/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const results: any = await query(
      'SELECT * FROM worlds WHERE clerk_id = ? ORDER BY updated_at DESC',
      [userId]
    );

    return NextResponse.json(Array.isArray(results) ? results : []);
  } catch (error) {
    console.error('Error fetching worlds:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { title, description, state } = body;
    const worldId = uuidv4();

    await query(
      `INSERT INTO worlds (id, clerk_id, title, description, state, version, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [worldId, userId, title, description, JSON.stringify(state || {}), 1]
    );

    return NextResponse.json(
      { id: worldId, title, description },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating world:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
