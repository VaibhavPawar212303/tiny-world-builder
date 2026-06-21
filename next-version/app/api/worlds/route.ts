import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { getDatabase, schema } from '@/app/lib/drizzle';
import { eq, desc } from 'drizzle-orm';
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

    const db = await getDatabase();
    const worlds = await db
      .select()
      .from(schema.worlds)
      .where(eq(schema.worlds.clerkId, userId))
      .orderBy(desc(schema.worlds.updatedAt));

    return NextResponse.json(worlds || []);
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

    const db = await getDatabase();
    await db.insert(schema.worlds).values({
      id: worldId,
      clerkId: userId,
      title,
      description,
      state: state || {},
      version: 1,
    });

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
