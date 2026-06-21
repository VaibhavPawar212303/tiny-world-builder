import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { getDatabase, schema } from '@/app/lib/drizzle';
import { eq, and } from 'drizzle-orm';

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

    const db = await getDatabase();
    const world = await db
      .select()
      .from(schema.worlds)
      .where(and(eq(schema.worlds.id, id), eq(schema.worlds.userId, userId)))
      .limit(1);

    if (!world || world.length === 0) {
      return NextResponse.json(
        { error: 'World not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(world[0]);
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

    const db = await getDatabase();
    await db
      .update(schema.worlds)
      .set({
        title,
        description,
        state,
      })
      .where(and(eq(schema.worlds.id, id), eq(schema.worlds.userId, userId)));

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

    const db = await getDatabase();
    await db
      .delete(schema.worlds)
      .where(and(eq(schema.worlds.id, id), eq(schema.worlds.userId, userId)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting world:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
