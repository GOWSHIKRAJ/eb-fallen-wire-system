# EB Fallen Wire System
Monitoring and **simulation** platform for fallen-wire and abnormal-line detection. Not a protection device: real isolation must use certified protection equipment and authorised engineers.

## Run
```
npm install && npm run typecheck && npm run build && npm run dev
```
Works with no credentials in **demo mode** (readings labelled DEMO DATA, kept in memory only, never saved).

## Database
Run `supabase/schema.sql` in the Supabase SQL editor, then copy `.env.example` to `.env.local` and fill it in.

## MQTT / HiveMQ
Vercel functions cannot hold an MQTT connection. Run `npm run bridge` on any always-on host (with the HIVEMQ_* variables); it subscribes to `eb/transformer/zone3/status` and POSTs to `/api/ingest`. Edit the payload mapping to match your ESP32 JSON.

## Deploy to Vercel
Push to GitHub, import in Vercel, set `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `INGEST_SECRET`, `MQTT_TOPIC`.

## Not included yet
Login/registration, dashboard reading from Supabase, date-range filter, Framer Motion/Tailwind.
