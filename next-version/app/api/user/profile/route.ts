import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { getDatabase, schema } from '@/app/lib/drizzle';
import { eq } from 'drizzle-orm';

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
    const user = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.clerkId, userId))
      .limit(1);

    if (!user || user.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(user[0]);
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

    const db = await getDatabase();

    // Check if user exists
    const existing = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.clerkId, userId))
      .limit(1);

    if (existing && existing.length > 0) {
      // Update existing user
      await db
        .update(schema.users)
        .set({
          email,
          firstName,
          lastName,
        })
        .where(eq(schema.users.clerkId, userId));
    } else {
      // Create new user
      await db.insert(schema.users).values({
        clerkId: userId,
        email,
        firstName,
        lastName,
      });
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
