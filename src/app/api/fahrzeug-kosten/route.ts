export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

function istAdminPasswort(req: NextRequest): boolean {
  const pw = req.headers.get('x-admin-password');
  return !!pw && !!process.env.ADMIN_PASSWORD && pw === process.env.ADMIN_PASSWORD;
}

function istPate(req: NextRequest): string | null {
  return req.headers.get('x-pate-id');
}

// GET: Kosten für ein Fahrzeug (Pate oder Admin)
export async function GET(req: NextRequest) {
  const fahrzeug_id = req.nextUrl.searchParams.get('fahrzeug_id');
  const pateId = istPate(req);
  const isAdmin = istAdminPasswort(req);

  if (!isAdmin && !pateId) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 });
  if (!fahrzeug_id) return NextResponse.json({ error: 'fahrzeug_id fehlt.' }, { status: 400 });

  // Paten dürfen nur ihr eigenes Fahrzeug abfragen
  if (pateId && !isAdmin) {
    const db = createServiceClient();
    const { data: pate } = await db
      .from('rikscha_paten')
      .select('fahrzeug_id')
      .eq('id', pateId)
      .eq('aktiv', true)
      .single();
    if (!pate || pate.fahrzeug_id !== fahrzeug_id) {
      return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 });
    }
  }

  const db = createServiceClient();
  const { data, error } = await db
    .from('rikscha_fahrzeug_kosten')
    .select('id, fahrzeug_id, jahr, posten, betrag, beschreibung, erfasst_am')
    .eq('fahrzeug_id', fahrzeug_id)
    .order('jahr', { ascending: false })
    .order('posten');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

// POST: Kosten eintragen (Admin)
export async function POST(req: NextRequest) {
  if (!istAdminPasswort(req)) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 });

  const { fahrzeug_id, jahr, posten, betrag, beschreibung } = await req.json();
  if (!fahrzeug_id || !jahr || !posten || betrag === undefined) {
    return NextResponse.json({ error: 'Fehlende Felder.' }, { status: 400 });
  }

  const db = createServiceClient();
  const { error } = await db
    .from('rikscha_fahrzeug_kosten')
    .upsert({ fahrzeug_id, jahr, posten, betrag, beschreibung: beschreibung ?? null },
             { onConflict: 'fahrzeug_id,jahr,posten' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// DELETE: Kosteneintrag löschen (Admin)
export async function DELETE(req: NextRequest) {
  if (!istAdminPasswort(req)) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'ID fehlt.' }, { status: 400 });

  const db = createServiceClient();
  const { error } = await db.from('rikscha_fahrzeug_kosten').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
