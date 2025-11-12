import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Redirect first-time visitors from home to the intro splash
  if (pathname === '/') {
    const seen = req.cookies.get('intro_seen')?.value;
    if (!seen) {
      const url = req.nextUrl.clone();
      url.pathname = '/introSplash';
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/'],
};

