export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { rolleAusAnfrage, darfWebBearbeiten } from '@/lib/pilotAuth';

const CORS = { 'Access-Control-Allow-Origin': '*' };

function istAdminPasswort(req: NextRequest): boolean {
  const pw = req.headers.get('x-admin-password');
  return !!pw && !!process.env.ADMIN_PASSWORD && pw === process.env.ADMIN_PASSWORD;
}

// GET ?fahrzeug=flotte_lotte  → gemeinsame (NULL) + fahrzeugspezifische Themen
// GET ?admin=1               → alle Themen mit fahrzeug_typ (für Admin-Editor)
export async function GET(req: NextRequest) {
  const fahrzeug = req.nextUrl.searchParams.get('fahrzeug');
  const admin = req.nextUrl.searchParams.get('admin');
  const db = createServiceClient();

  if (admin) {
    const { data, error } = await db
      .from('rikscha_einweisungsthemen')
      .select('id, gruppe, punkte, reihenfolge, fahrzeug_typ')
      .order('fahrzeug_typ', { nullsFirst: true })
      .order('reihenfolge');
    if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: CORS });
    return NextResponse.json(data ?? [], { headers: CORS });
  }

  // Für Beleg: gemeinsame (NULL) + ggf. fahrzeugspezifische
  let q = db
    .from('rikscha_einweisungsthemen')
    .select('id, gruppe, punkte, reihenfolge, fahrzeug_typ')
    .order('reihenfolge');

  if (fahrzeug) {
    q = q.or(`fahrzeug_typ.is.null,fahrzeug_typ.eq.${fahrzeug}`);
  } else {
    q = q.is('fahrzeug_typ', null);
  }

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: CORS });
  return NextResponse.json(data ?? [], { headers: CORS });
}

export async function PUT(req: NextRequest) {
  const { rolle } = await rolleAusAnfrage(req);
  if (!darfWebBearbeiten(rolle) && !istAdminPasswort(req))
    return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 });

  const body = await req.json();
  const { id, gruppe, punkte, reihenfolge, fahrzeug_typ } = body;
  if (!id) return NextResponse.json({ error: 'Fehlende ID.' }, { status: 400 });

  const db = createServiceClient();
  const { error } = await db
    .from('rikscha_einweisungsthemen')
    .update({ gruppe, punkte, reihenfolge, fahrzeug_typ: fahrzeug_typ ?? null })
    .eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: CORS });
  return NextResponse.json({ ok: true }, { headers: CORS });
}

export async function POST(req: NextRequest) {
  const { rolle } = await rolleAusAnfrage(req);
  if (!darfWebBearbeiten(rolle) && !istAdminPasswort(req))
    return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 });

  const { gruppe, punkte, reihenfolge, fahrzeug_typ } = await req.json();
  if (!gruppe) return NextResponse.json({ error: 'Fehlende Gruppe.' }, { status: 400 });

  const db = createServiceClient();
  const { data, error } = await db
    .from('rikscha_einweisungsthemen')
    .insert({ gruppe, punkte: punkte ?? [], reihenfolge: reihenfolge ?? 99, fahrzeug_typ: fahrzeug_typ ?? null })
    .select('id')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: CORS });
  return NextResponse.json({ ok: true, id: data.id }, { status: 201, headers: CORS });
}

export async function DELETE(req: NextRequest) {
  const { rolle } = await rolleAusAnfrage(req);
  if (!darfWebBearbeiten(rolle) && !istAdminPasswort(req))
    return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'Fehlende ID.' }, { status: 400 });

  const db = createServiceClient();
  const { error } = await db.from('rikscha_einweisungsthemen').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: CORS });
  return NextResponse.json({ ok: true }, { headers: CORS });
}
