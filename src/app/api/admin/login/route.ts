export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { zuViele, merke } from '@/lib/spamschutz';
import { adminCookieWert } from '@/lib/passwort';

export async function POST(req: NextRequest) {
  if (await zuViele(req, 'login-fehler', [{ max: 10, minuten: 15 }, { max: 30, minuten: 1440 }])) {
    return NextResponse.json({ error: 'Zu viele falsche Versuche. Bitte 15 Minuten warten.' }, { status: 429 });
  }
  const { password } = await req.json().catch(() => ({}));
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || password !== expected) {
    await merke(req, 'login-fehler');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set('admin_session', adminCookieWert() ?? '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 8, // 8 Stunden
    path: '/',
  });
  return res;
}
