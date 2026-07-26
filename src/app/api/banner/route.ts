export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

async function checkPilot(db: ReturnType<typeof createServiceClient>, pilot: string, password: string) {
  const { data } = await db
    .from('piloten_zugang')
    .select('id')
    .eq('name', pilot)
    .eq('passwort', password)
    .eq('aktiv', true)
    .maybeSingle();
  return !!data;
}

export async function GET() {
  const db = createServiceClient();
  const { data } = await db
    .from('inhalte')
    .select('schluessel, wert')
    .like('schluessel', 'banner_%')
    .order('schluessel');

  const texte: string[] = [];
  if (data) {
    for (const row of data) {
      if (row.wert?.trim()) texte.push(row.wert);
    }
  }
  return NextResponse.json(texte);
}

export async function POST(req: NextRequest) {
  const { pilot, password, texte } = await req.json() as {
    pilot: string;
    password: string;
    texte: string[];
  };

  if (!pilot || !password || !Array.isArray(texte)) {
    return NextResponse.json({ error: 'Fehlende Felder.' }, { status: 400 });
  }

  const db = createServiceClient();
  if (!(await checkPilot(db, pilot, password))) {
    return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 });
  }

  // Alte Banner-Einträge entfernen, dann neue speichern
  await db.from('inhalte').delete().like('schluessel', 'banner_%');

  const rows = texte
    .map((t, i) => t.trim())
    .filter(Boolean)
    .map((wert, i) => ({
      schluessel: `banner_${i + 1}`,
      wert,
      bezeichnung: `Banner ${i + 1}`,
      geaendert_von: pilot,
      geaendert_am: new Date().toISOString(),
    }));

  if (rows.length > 0) {
    await db.from('inhalte').insert(rows);
  }

  return NextResponse.json({ ok: true });
}
