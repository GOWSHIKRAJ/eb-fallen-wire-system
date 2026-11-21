import Link from 'next/link';
export default function Home() {
  return (
    <main className="wrap">
      <nav className="nav"><b>EB Fallen Wire System</b><Link className="btn" href="/dashboard">Open dashboard</Link></nav>
      <section className="hero">
        <div>
          <h1>A wire on the ground should never stay live.</h1>
          <p className="lead">Monitor voltage and current on every feeder, spot a fallen conductor within seconds, and see exactly when a cut-off would be commanded.</p>
          <Link className="btn primary" href="/dashboard">Run the live demo</Link>
        </div>
        <svg viewBox="0 0 420 220" className="art" role="img" aria-label="Power line breaking and falling to the ground">
          <line x1="40" y1="30" x2="40" y2="200" stroke="#2f8cff" strokeWidth="6"/><line x1="380" y1="30" x2="380" y2="200" stroke="#2f8cff" strokeWidth="6"/>
          <path d="M40 40 Q110 70 200 60" fill="none" stroke="#4de1ff" strokeWidth="3"/>
          <path d="M380 40 Q330 90 290 150 L240 190" fill="none" stroke="#ff4d5e" strokeWidth="3"/>
          <circle cx="240" cy="190" r="8" fill="#ff4d5e"/><line x1="0" y1="205" x2="420" y2="205" stroke="#1c2e4d" strokeWidth="2"/>
        </svg>
      </section>
      <section className="grid3">
        <div className="card"><h3>Detect</h3><p>ESP32 nodes publish readings to MQTT topic <code>eb/transformer/zone3/status</code>. Sudden voltage collapse with a current spike marks a fallen wire.</p></div>
        <div className="card"><h3>Alert</h3><p>Critical and warning events appear instantly in the dashboard with timestamps and an acknowledge workflow.</p></div>
        <div className="card"><h3>Isolate</h3><p>The demo shows a simulated cut-off. Real isolation must be done only by certified protection equipment and authorised engineers.</p></div>
      </section>
      <footer className="foot">Monitoring and simulation platform. Not a substitute for certified electrical protection.</footer>
    </main>
  );
}
