import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import type { Permission } from './permissions';

export interface CrSession {
  operator_id: string;
  email: string;
  name: string;
  is_root: boolean;
  permissions: string[];
}

const secret = () => {
  const s = process.env.CR_JWT_SECRET;
  if (!s || s.length < 32) throw new Error('CR_JWT_SECRET must be set (>= 32 chars)');
  return new TextEncoder().encode(s);
};

const COOKIE = 'omeru_cr_session';
const SESSION_HOURS = 8; // short-lived — this is an admin surface

export async function signSession(payload: CrSession): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_HOURS}h`)
    .sign(secret());
}

export async function getSession(): Promise<CrSession | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload as unknown as CrSession;
  } catch {
    return null;
  }
}

/** Throws a Response-shaped error object when the permission is missing. */
export async function requirePermission(perm: Permission): Promise<CrSession> {
  const session = await getSession();
  if (!session) throw unauthorized();
  if (!session.is_root && !session.permissions.includes(perm)) throw forbidden();
  return session;
}

export function unauthorized() {
  return new Response(JSON.stringify({ error: 'Not signed in' }), {
    status: 401, headers: { 'Content-Type': 'application/json' },
  });
}
export function forbidden() {
  return new Response(JSON.stringify({ error: 'Missing permission' }), {
    status: 403, headers: { 'Content-Type': 'application/json' },
  });
}

export async function setSessionCookie(token: string) {
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * SESSION_HOURS,
    path: '/',
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export const SESSION_COOKIE_NAME = COOKIE;
