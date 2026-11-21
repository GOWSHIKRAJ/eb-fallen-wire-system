export type Status = 'healthy' | 'warning' | 'fault' | 'isolated';
export type Kind = 'wire' | 'voltage' | 'current';
export interface Zone { id: string; name: string; transformer: string; v: number; i: number; status: Status; ov?: { kind: Kind; ttl: number } }
export interface Ev { id: number; ts: string; zone: string; type: string; severity: 'critical' | 'warning'; acked: boolean }
export interface Sim { tick: number; nextId: number; zones: Zone[]; events: Ev[] }
export const NOMINAL_V = 230;

export function init(): Sim {
  const names = ['Anna Nagar', 'Ambattur', 'Zone 3 Feeder', 'Avadi'];
  return {
    tick: 0, nextId: 1, events: [],
    zones: names.map((n, k) => ({ id: 'Z' + (k + 1), name: n, transformer: 'TR-' + (101 + k), v: NOMINAL_V, i: 18 + k * 4, status: 'healthy' as Status })),
  };
}

// Deterministic: readings depend only on tick and zone index.
export function step(s: Sim, now: Date = new Date()): Sim {
  const tick = s.tick + 1;
  let nextId = s.nextId;
  const events = [...s.events];
  const ts = now.toISOString();
  const zones = s.zones.map((z, k): Zone => {
    if (z.status === 'isolated') return { ...z, v: 0, i: 0 };
    let v = NOMINAL_V + Math.sin(tick * 0.6 + k * 2) * 4 + Math.sin(tick * 1.7 + k) * 1.5;
    let i = 18 + k * 4 + Math.sin(tick * 0.4 + k) * 3;
    let status: Status = 'healthy';
    let ov = z.ov;
    if (ov) {
      if (ov.kind === 'voltage') { v = 268; status = 'warning'; }
      if (ov.kind === 'current') { i = 78; status = 'warning'; }
      if (ov.kind === 'wire') { v = 38; i = 115; status = 'fault'; }
      const ttl = ov.ttl - 1;
      if (ttl <= 0) {
        if (ov.kind === 'wire') {
          events.unshift({ id: nextId++, ts, zone: z.id, type: 'Cut-off (simulated)', severity: 'critical', acked: false });
          return { ...z, v: 0, i: 0, status: 'isolated', ov: undefined };
        }
        ov = undefined;
      } else ov = { ...ov, ttl };
    }
    return { ...z, v, i, status, ov };
  });
  return { tick, nextId, zones, events: events.slice(0, 200) };
}

export function trigger(s: Sim, kind: Kind, zoneId: string, now: Date = new Date()): Sim {
  const z = s.zones.find(x => x.id === zoneId);
  if (!z || z.status === 'isolated' || z.ov) return s;
  const type = kind === 'wire' ? 'Fallen wire' : kind === 'voltage' ? 'Over-voltage' : 'Over-current';
  const ev: Ev = { id: s.nextId, ts: now.toISOString(), zone: zoneId, type, severity: kind === 'wire' ? 'critical' : 'warning', acked: false };
  return { ...s, nextId: s.nextId + 1, events: [ev, ...s.events], zones: s.zones.map(x => x.id === zoneId ? { ...x, ov: { kind, ttl: kind === 'wire' ? 2 : 5 } } : x) };
}

// Acknowledging clears alerts and restores simulated isolated zones.
export function ack(s: Sim): Sim {
  return { ...s, events: s.events.map(e => ({ ...e, acked: true })), zones: s.zones.map(z => z.status === 'isolated' ? { ...z, status: 'healthy' as Status, v: NOMINAL_V, i: 18 } : z) };
}
