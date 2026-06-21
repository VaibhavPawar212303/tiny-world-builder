import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { getDatabase, schema } from '@/app/lib/drizzle';
import { eq } from 'drizzle-orm';

export async function POST(req: Request) {
  const headerPayload = await headers();
  const svixId = headerPayload.get('svix-id');
  const svixTimestamp = headerPayload.get('svix-timestamp');
  const svixSignature = headerPayload.get('svix-signature');

  // Handle missing headers
  if (!svixId || !svixTimestamp || !svixSignature) {
    console.error('Missing Clerk webhook headers');
    return NextResponse.json(
      { error: 'Missing webhook headers' },
      { status: 400 }
    );
  }

  const body = await req.text();
  const secret = process.env.CLERK_WEBHOOK_SECRET;

  if (!secret) {
    console.error('CLERK_WEBHOOK_SECRET not set');
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    );
  }

  try {
    // Verify the webhook
    const wh = new Webhook(secret);
    const evt = wh.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    });

    // Handle user.created event
    if (evt.type === 'user.created') {
      const { id, email_addresses, first_name, last_name, image_url } = evt.data;

      const db = await getDatabase();
      const userEmail = email_addresses?.[0]?.email_address;

      if (!userEmail) {
        console.error('User created without email');
        return NextResponse.json(
          { error: 'User email not found' },
          { status: 400 }
        );
      }

      // Check if user already exists
      const existing = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.clerkId, id))
        .limit(1);

      if (existing && existing.length > 0) {
        // User already exists, update their info
        await db
          .update(schema.users)
          .set({
            email: userEmail,
            firstName: first_name || undefined,
            lastName: last_name || undefined,
            avatarUrl: image_url || undefined,
          })
          .where(eq(schema.users.clerkId, id));
      } else {
        // Create new user
        await db.insert(schema.users).values({
          clerkId: id,
          email: userEmail,
          firstName: first_name || undefined,
          lastName: last_name || undefined,
          avatarUrl: image_url || undefined,
        });
      }

      console.log(`User ${id} created/updated in database`);
      return NextResponse.json({ success: true });
    }

    // Handle user.updated event
    if (evt.type === 'user.updated') {
      const { id, email_addresses, first_name, last_name, image_url } = evt.data;

      const db = await getDatabase();
      const userEmail = email_addresses?.[0]?.email_address;

      if (userEmail) {
        await db
          .update(schema.users)
          .set({
            email: userEmail,
            firstName: first_name || undefined,
            lastName: last_name || undefined,
            avatarUrl: image_url || undefined,
          })
          .where(eq(schema.users.clerkId, id));

        console.log(`User ${id} updated in database`);
      }

      return NextResponse.json({ success: true });
    }

    // Handle user.deleted event
    if (evt.type === 'user.deleted') {
      const { id } = evt.data;

      // Optional: Delete user from database or mark as inactive
      console.log(`User ${id} deleted from Clerk`);

      return NextResponse.json({ success: true });
    }

    // Return success for other event types
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook verification failed:', error);
    return NextResponse.json(
      { error: 'Webhook verification failed' },
      { status: 400 }
    );
  }
}
