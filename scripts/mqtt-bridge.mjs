// Runs OUTSIDE Vercel (serverless cannot hold an MQTT connection). Forwards HiveMQ messages to /api/ingest.
// Assumes the ESP32 publishes JSON like {"voltage":229.4,"current":18.2,"status":"ok"}. Adjust if yours differs.
import mqtt from 'mqtt';
const { HIVEMQ_URL, HIVEMQ_USER, HIVEMQ_PASSWORD, INGEST_URL, INGEST_SECRET, MQTT_TOPIC = 'eb/transformer/zone3/status' } = process.env;
if (!HIVEMQ_URL || !INGEST_URL || !INGEST_SECRET) { console.error('Set HIVEMQ_URL, INGEST_URL, INGEST_SECRET'); process.exit(1); }
const c = mqtt.connect(HIVEMQ_URL, { username: HIVEMQ_USER, password: HIVEMQ_PASSWORD });
c.on('connect', () => c.subscribe(MQTT_TOPIC));
c.on('message', async (topic, msg) => {
  try {
    const d = JSON.parse(msg.toString());
    const zone = topic.split('/')[2] || 'zone3';
    const r = await fetch(INGEST_URL, { method: 'POST', headers: { 'content-type': 'application/json', 'x-ingest-secret': INGEST_SECRET }, body: JSON.stringify({ zone, ...d }) });
    if (!r.ok) console.error('ingest failed', r.status, await r.text());
  } catch (e) { console.error('bad message', e.message); }
});
