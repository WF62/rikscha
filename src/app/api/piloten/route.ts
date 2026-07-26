export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET(_req: NextRequest) {
  const db = createServiceClient();
  const { data, error } = await db
    .from('piloten_zugang')
    .select('id, name, rolle')
    .eq('aktiv', true)
    .order('name');

  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: CORS });

  const liste = data ?? [];
  const adminName = process.env.ADMIN_NAME || 'Admin';
  const hatAdmin = liste.some((p: { name: string }) => p.name === adminName);
  if (!hatAdmin && process.env.ADMIN_PASSWORD) {
    liste.unshift({ id: 'admin', name: adminName, rolle: 'admin' });
  }

  return NextResponse.json(liste, { headers: CORS });
}
