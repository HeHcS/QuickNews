import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the path starts with /@
  if (pathname.startsWith('/@')) {
    // Remove the @ symbol and redirect
    const newPath = pathname.replace('/@', '/');
    return NextResponse.redirect(new URL(newPath, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/@:handle*',
}; 