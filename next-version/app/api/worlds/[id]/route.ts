import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { query } from '@/app/lib/db';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const results: any = await query(
      'SELECT * FROM worlds WHERE id = ? AND clerk_id = ?',
      [id, userId]
    );

    if (!Array.isArray(results) || results.length === 0) {
      return NextResponse.json(
        { error: 'World not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(results[0]);
  } catch (error) {
    console.error('Error fetching world:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { title, description, state } = body;

    await query(
      `UPDATE worlds SET title = ?, description = ?, state = ?, updated_at = NOW()
       WHERE id = ? AND clerk_id = ?`,
      [title, description, JSON.stringify(state), id, userId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating world:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await query(
      'DELETE FROM worlds WHERE id = ? AND clerk_id = ?',
      [id, userId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting world:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
