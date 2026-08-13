export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { sendKontaktEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  const { name, email, anliegen, nachricht } = await req.json();
  if (!name || !email || !nachricht) {
    return NextResponse.json({ error: 'Pflichtfelder fehlen.' }, { status: 400 });
  }
  try {
    await sendKontaktEmail({ name, email, anliegen, nachricht });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'E-Mail konnte nicht gesendet werden.' }, { status: 500 });
  }
}
