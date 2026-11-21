'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { init, step, trigger, ack, Sim, Kind } from '@/lib/sim';

type Pt = { t: string; v: number; i: number };
type Cfg = { supabase: boolean; secret: boolean; topic: string } | null;

export default function Dashboard() {
  const [sim, setSim] = useState<Sim>(() => init());
  const [run, setRun] = useState(true);
  const [sel, setSel] = useState('Z3');
  const [hist, setHist] = useState<Record<string, Pt[]>>({});
  const [q, setQ] = useState('');
  const [ty, setTy] = useState('all');
  const [cfg, setCfg] = useState<Cfg>(null);
  const [cfgErr, setCfgErr] = useState(false);

  useEffect(() => { fetch('/api/ingest').then(r => r.json()).then(setCfg).catch(() => setCfgErr(true)); }, []);
  useEffect(() => { if (!run) return; const id = setInterval(() => setSim(s => step(s)), 1500); return () => clearInterval(id); }, [run]);
  useEffect(() => {
    setHist(h => { const n = { ...h }; sim.zones.forEach(z => { n[z.id] = [...(n[z.id] || []).slice(-29), { t: String(sim.tick), v: Math.round(z.v), i: Math.round(z.i) }]; }); return n; });
  }, [sim.tick]); // eslint-disable-line react-hooks/exhaustive-deps

  const zone = sim.zones.find(z => z.id === sel)!;
  const healthy = sim.zones.filter(z => z.status === 'healthy').length;
  const faults = sim.events.filter(e => e.type === 'Fallen wire').length;
  const cutoffs = sim.events.filter(e => e.type.startsWith('Cut-off')).length;
  const open = sim.events.filter(e => !e.acked);
  const rows = useMemo(() => sim.events.filter(e => (ty === 'all' || e.type === ty) && (e.zone + e.type).toLowerCase().includes(q.toLowerCase())), [sim.events, q, ty]);
  const fire = (k: Kind) => setSim(s => trigger(s, k, sel));
  const stateLabel = cfgErr ? 'Status check failed' : !cfg ? 'Checking…' : cfg.supabase ? 'Database configured' : 'No database: demo data is not stored';

  return (
    <div className="wrap">
      <nav className="nav"><Link href="/"><b>EB Fallen Wire System</b></Link><span className="tag">DEMO DATA: simulated readings</span></nav>
      <div className="conn card"><span>Mode: <b>Demo</b> (no hardware connected)</span><span>Topic: <code>{cfg?.topic ?? 'eb/transformer/zone3/status'}</code></span><span>{stateLabel}</span></div>

      <section className="stats">
        <Stat l="Transformers" v={sim.zones.length} /><Stat l="Active zones" v={sim.zones.filter(z => z.status !== 'isolated').length} />
        <Stat l="Healthy lines" v={healthy} c="g" /><Stat l="Fallen wire faults" v={faults} c="r" /><Stat l="Cut-off events" v={cutoffs} c="a" />
      </section>

      <section className="card ctl">
        <button className="btn" onClick={() => setRun(r => !r)}>{run ? 'Pause simulation' : 'Start simulation'}</button>
        <button className="btn" onClick={() => { setSim(init()); setHist({}); }}>Reset</button>
        <button className="btn danger" onClick={() => fire('wire')}>Fallen wire in {sel}</button>
        <button className="btn" onClick={() => fire('voltage')}>Abnormal voltage</button>
        <button className="btn" onClick={() => fire('current')}>Abnormal current</button>
        <button className="btn" onClick={() => setSim(s => ack(s))} disabled={!open.length && sim.zones.every(z => z.status !== 'isolated')}>Acknowledge alerts</button>
      </section>

      <section className="zones">
        {sim.zones.map(z => (
          <button key={z.id} className={'card zone ' + z.status + (z.id === sel ? ' sel' : '')} onClick={() => setSel(z.id)} aria-pressed={z.id === sel}>
            <b>{z.name}</b><small>{z.transformer} · {z.status}</small>
            <span>{z.v.toFixed(0)} V</span><span>{z.i.toFixed(1)} A</span>
          </button>
        ))}
      </section>

      <section className="two">
        <div className="card"><h3>{zone.name}: voltage (V)</h3><Chart data={hist[sel] || []} k="v" color="#2f8cff" /></div>
        <div className="card"><h3>{zone.name}: current (A)</h3><Chart data={hist[sel] || []} k="i" color="#4de1ff" /></div>
      </section>

      <section className="two">
        <div className="card">
          <h3>Notifications ({open.length})</h3>
          {open.length === 0 ? <p className="mut">No open alerts. Trigger a demo event to see one.</p> :
            open.slice(0, 5).map(e => <p key={e.id} className={'note ' + e.severity}>{e.type} in {e.zone} at {new Date(e.ts).toLocaleTimeString()}</p>)}
        </div>
        <div className="card">
          <h3>Fault history</h3>
          <div className="filters">
            <input placeholder="Search zone or type" value={q} onChange={e => setQ(e.target.value)} aria-label="Search events" />
            <select value={ty} onChange={e => setTy(e.target.value)} aria-label="Filter by type">
              {['all', 'Fallen wire', 'Over-voltage', 'Over-current', 'Cut-off (simulated)'].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          {rows.length === 0 ? <p className="mut">No events match.</p> :
            <div className="scroll"><table><thead><tr><th>Time</th><th>Zone</th><th>Event</th><th>State</th></tr></thead><tbody>
              {rows.map(e => <tr key={e.id}><td>{new Date(e.ts).toLocaleTimeString()}</td><td>{e.zone}</td><td className={e.severity}>{e.type}</td><td>{e.acked ? 'Acknowledged' : 'Open'}</td></tr>)}
            </tbody></table></div>}
        </div>
      </section>
    </div>
  );
}

function Stat({ l, v, c }: { l: string; v: number; c?: string }) { return <div className={'card stat ' + (c || '')}><small>{l}</small><b>{v}</b></div>; }
function Chart({ data, k, color }: { data: Pt[]; k: 'v' | 'i'; color: string }) {
  return (<div style={{ width: '100%', height: 220 }}><ResponsiveContainer><LineChart data={data}><CartesianGrid stroke="#1c2e4d" /><XAxis dataKey="t" hide /><YAxis stroke="#7f93b5" width={40} domain={['auto', 'auto']} /><Tooltip contentStyle={{ background: '#0e1a2e', border: '1px solid #1c2e4d' }} /><Line type="monotone" dataKey={k} stroke={color} dot={false} isAnimationActive={false} strokeWidth={2} /></LineChart></ResponsiveContainer></div>);
}
