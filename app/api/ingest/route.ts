import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    supabase: !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
    secret: !!process.env.INGEST_SECRET,
    topic: process.env.MQTT_TOPIC || 'eb/transformer/zone3/status',
  });
}

export async function POST(req: Request) {
  const secret = process.env.INGEST_SECRET;
  if (!secret || req.headers.get('x-ingest-secret') !== secret) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ error: 'Supabase not configured; reading was NOT stored' }, { status: 503 });
  let b: any;
  try { b = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }
  const { zone, voltage, current, status } = b ?? {};
  if (typeof zone !== 'string' || !Number.isFinite(voltage) || !Number.isFinite(current)) return NextResponse.json({ error: 'Expected {zone:string, voltage:number, current:number}' }, { status: 400 });
  const db = createClient(url, key, { auth: { persistSession: false } });
  const { error } = await db.from('readings').insert({ zone_code: zone, voltage, current_a: current, status: typeof status === 'string' ? status : null });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ stored: true });
}
