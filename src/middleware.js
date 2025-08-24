import { NextResponse } from 'next/server';

export function middleware(request) {
  // Redirect fountain.html to /fountain
  if (request.nextUrl.pathname === '/fountain.html') {
    return NextResponse.redirect(new URL('/fountain', request.url));
  }
}

export const config = {
  matcher: '/fountain.html',
};