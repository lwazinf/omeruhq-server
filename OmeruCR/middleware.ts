import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// Everything in the Control Room is behind a session except the auth surface.
const PUBLIC_PATHS = ['/login', '/register', '/api/auth/login', '/api/auth/register'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    return NextResponse.next();
  }

  const token = req.cookies.get('omeru_cr_session')?.value;
  if (token && process.env.CR_JWT_SECRET) {
    try {
      await jwtVerify(token, new TextEncoder().encode(process.env.CR_JWT_SECRET));
      return NextResponse.next();
    } catch {
      /* fall through to redirect */
    }
  }

  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  }
  const login = req.nextUrl.clone();
  login.pathname = '/login';
  login.search = '';
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
