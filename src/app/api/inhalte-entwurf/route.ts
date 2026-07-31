export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getPilotRolle, istAdmin } from '@/lib/pilotAuth';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

// GET: Entwürfe (alle offen) oder Verlauf eines Schlüssels
// ?pilot=X&password=Y           → offene Entwürfe (admin only)
// ?pilot=X&password=Y&verlauf=schluessel → Verlauf (admin only)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const pilot    = searchParams.get('pilot')    ?? '';
  const password = searchParams.get('password') ?? '';
  const verlaufKey = searchParams.get('verlauf');

  const rolle = await getPilotRolle(pilot, password);
  if (!rolle || !istAdmin(rolle)) {
    return NextResponse.json({ error: 'Nur für Admins.' }, { status: 403, headers: CORS });
  }

  const db = createServiceClient();

  if (verlaufKey) {
    const { data, error } = await db
      .from('rikscha_inhalte_verlauf')
      .select('id, schluessel, wert, geaendert_von, geaendert_am')
      .eq('schluessel', verlaufKey)
      .order('geaendert_am', { ascending: false })
      .limit(20);
    if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: CORS });
    return NextResponse.json(data ?? [], { headers: CORS });
  }

  const { data, error } = await db
    .from('rikscha_inhalte_entwurf')
    .select('id, schluessel, wert, eingereicht_von, eingereicht_am, status, kommentar')
    .eq('status', 'offen')
    .order('eingereicht_am', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: CORS });
  return NextResponse.json(data ?? [], { headers: CORS });
}

// PATCH: Entwurf freigeben / ablehnen  oder  Rollback aus Verlauf
// { pilot, password, id, aktion: 'freigeben'|'ablehnen', kommentar? }
// { pilot, password, verlaufId, schluessel, wert }  → rollback
export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { pilot, password } = body;

  const rolle = await getPilotRolle(pilot, password);
  if (!rolle || !istAdmin(rolle)) {
    return NextResponse.json({ error: 'Nur für Admins.' }, { status: 403, headers: CORS });
  }

  const db = createServiceClient();
  const ts = new Date().toISOString();

  // Rollback
  if (body.verlaufId) {
    const { schluessel, wert } = body;
    // Aktuellen Wert zuerst in Verlauf sichern
    const { data: alt } = await db.from('inhalte').select('wert').eq('schluessel', schluessel).maybeSingle();
    if (alt?.wert !== undefined) {
      await db.from('rikscha_inhalte_verlauf').insert({ schluessel, wert: alt.wert, geaendert_von: `${pilot} (Rollback)` });
    }
    await db.from('inhalte').update({ wert, geaendert_von: pilot, geaendert_am: ts }).eq('schluessel', schluessel);
    return NextResponse.json({ ok: true }, { headers: CORS });
  }

  // Freigeben oder ablehnen
  const { id, aktion, kommentar } = body;
  if (!id || !aktion) return NextResponse.json({ error: 'Fehlende Felder.' }, { status: 400, headers: CORS });

  if (aktion === 'freigeben') {
    const { data: entwurf } = await db.from('rikscha_inhalte_entwurf').select('schluessel, wert').eq('id', id).single();
    if (!entwurf) return NextResponse.json({ error: 'Entwurf nicht gefunden.' }, { status: 404, headers: CORS });

    // Alten Wert in Verlauf sichern
    const { data: alt } = await db.from('inhalte').select('wert').eq('schluessel', entwurf.schluessel).maybeSingle();
    if (alt?.wert !== undefined) {
      await db.from('rikscha_inhalte_verlauf').insert({ schluessel: entwurf.schluessel, wert: alt.wert, geaendert_von: pilot });
    }

    // Live schalten
    const { data: updated } = await db.from('inhalte').update({ wert: entwurf.wert, geaendert_von: pilot, geaendert_am: ts }).eq('schluessel', entwurf.schluessel).select('schluessel');
    if (!updated || updated.length === 0) {
      await db.from('inhalte').insert({ schluessel: entwurf.schluessel, wert: entwurf.wert, bezeichnung: entwurf.schluessel, geaendert_von: pilot, geaendert_am: ts });
    }
  }

  await db.from('rikscha_inhalte_entwurf').update({ status: aktion === 'freigeben' ? 'freigegeben' : 'abgelehnt', bearbeitet_von: pilot, bearbeitet_am: ts, kommentar: kommentar ?? null }).eq('id', id);

  return NextResponse.json({ ok: true }, { headers: CORS });
}
