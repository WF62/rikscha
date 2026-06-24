import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const von      = searchParams.get('von');
  const bis      = searchParams.get('bis');
  const pilot    = searchParams.get('pilot');
  const fahrzeug = searchParams.get('fahrzeug');

  const sb = createServiceClient();
  let q = sb.from('rikscha_buchungen').select('*').order('datum').order('startzeit');
  if (von)      q = q.gte('datum', von);
  if (bis)      q = q.lte('datum', bis);
  if (pilot)    q = q.eq('pilot', pilot);
  if (fahrzeug) q = q.eq('fahrzeug', fahrzeug);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { fahrzeug, pilot, gaeste, datum, startzeit, endzeit, notiz } = body;

  if (!datum || !startzeit || !endzeit) {
    return NextResponse.json({ error: 'Datum und Zeiten sind Pflicht.' }, { status: 400 });
  }
  // Mindestens Pilot ODER Fahrzeug muss angegeben sein
  if (!pilot && !fahrzeug) {
    return NextResponse.json({ error: 'Bitte mindestens Pilot oder Fahrzeug angeben.' }, { status: 400 });
  }

  const sb = createServiceClient();

  // Sperre nur prüfen wenn Fahrzeug gewählt
  if (fahrzeug) {
    const { data: sperren } = await sb
      .from('rikscha_sperren')
      .select('id')
      .eq('fahrzeug', fahrzeug)
      .lte('von_datum', datum)
      .gte('bis_datum', datum);
    if (sperren && sperren.length > 0) {
      return NextResponse.json({ error: 'Fahrzeug ist an diesem Tag gesperrt.' }, { status: 409 });
    }
  }

  const { data, error } = await sb
    .from('rikscha_buchungen')
    .insert({
      fahrzeug: fahrzeug || '',
      pilot:    pilot    || '',
      gaeste:   gaeste   ?? [],
      datum,
      startzeit,
      endzeit,
      notiz: notiz || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
