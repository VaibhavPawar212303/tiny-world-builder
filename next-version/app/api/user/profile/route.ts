import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { query } from '@/app/lib/db';

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
      'SELECT * FROM users WHERE clerk_id = ?',
      [userId]
    );

    if (!Array.isArray(results) || results.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(results[0]);
  } catch (error) {
    console.error('Error fetching profile:', error);
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
    const { email, firstName, lastName } = body;

    // Check if user exists
    const existing: any = await query(
      'SELECT * FROM users WHERE clerk_id = ?',
      [userId]
    );

    if (Array.isArray(existing) && existing.length > 0) {
      // Update existing user
      await query(
        'UPDATE users SET email = ?, first_name = ?, last_name = ?, updated_at = NOW() WHERE clerk_id = ?',
        [email, firstName, lastName, userId]
      );
    } else {
      // Create new user
      await query(
        'INSERT INTO users (clerk_id, email, first_name, last_name, created_at) VALUES (?, ?, ?, ?, NOW())',
        [userId, email, firstName, lastName]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
