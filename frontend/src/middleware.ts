import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes that don't require authentication
  const publicRoutes = ['/', '/login', '/register', '/auth/google/callback', '/profile/complete', '/verify-email'];
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // For protected routes, let the client-side handle authentication
  // The AuthContext will check localStorage and redirect if needed
  if (pathname.startsWith('/admin') || pathname.startsWith('/student') || pathname.startsWith('/expert')) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}; 