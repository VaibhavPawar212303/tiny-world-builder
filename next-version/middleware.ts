import { NextRequest, NextResponse } from 'next/server';

// Public routes that don't require authentication
const publicRoutes = ['/', '/sign-in', '/sign-up'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Check authentication via API proxy
  try {
    const authResponse = await fetch(
      new URL('/api/auth/proxy', request.nextUrl.origin),
      {
        headers: {
          cookie: request.headers.get('cookie') || '',
        },
      }
    );

    if (!authResponse.ok) {
      return NextResponse.redirect(new URL('/sign-in', request.nextUrl));
    }

    const auth = await authResponse.json();
    if (!auth.authenticated) {
      return NextResponse.redirect(new URL('/sign-in', request.nextUrl));
    }
  } catch (error) {
    // If auth check fails, redirect to sign-in
    return NextResponse.redirect(new URL('/sign-in', request.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!.+\\.[\\w]+$|_next).*)',
    '/',
    '/(api|trpc)(.*)',
  ],
};
