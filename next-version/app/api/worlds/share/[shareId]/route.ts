import { NextResponse } from 'next/server';
import { getDatabase, schema } from '@/app/lib/drizzle';
import { eq } from 'drizzle-orm';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ shareId: string }> }
) {
  try {
    const { shareId } = await params;

    if (!shareId) {
      return NextResponse.json(
        { error: 'Share ID required' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const world = await db
      .select()
      .from(schema.worlds)
      .where(eq(schema.worlds.shareId, shareId))
      .limit(1);

    if (!world || world.length === 0) {
      return NextResponse.json(
        { error: 'Shared world not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(world[0]);
  } catch (error) {
    console.error('Error fetching shared world:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
