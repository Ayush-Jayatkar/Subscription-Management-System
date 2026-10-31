import { useEffect, useState } from 'react'
import { ArrowUpRight, ArrowDownRight, CirclePlus, Download, Users, Repeat2, Wallet, Clock3 } from 'lucide-react'
import { getSystemStatus } from '../services/api'

const metrics = [
  { label: 'Total customers', value: '—', change: 'Connect customer module', icon: Users, tone: 'violet' },
  { label: 'Active subscriptions', value: '—', change: 'Connect subscription module', icon: Repeat2, tone: 'blue' },
  { label: 'Revenue this month', value: '—', change: 'Connect billing module', icon: Wallet, tone: 'green' },
  { label: 'Overdue invoices', value: '—', change: 'Connect invoice module', icon: Clock3, tone: 'orange' },
]

export default function Dashboard() {
  const [systemStatus, setSystemStatus] = useState({ api: 'checking', database: 'checking' })

  useEffect(() => {
    let mounted = true
    getSystemStatus()
      .then((status) => { if (mounted) setSystemStatus(status) })
      .catch(() => { if (mounted) setSystemStatus({ api: 'unavailable', database: 'unavailable' }) })
    return () => { mounted = false }
  }, [])

  return (
    <div className="page-content">
      <section className="page-heading">
        <div><div className="eyebrow">SATURDAY, 31 OCTOBER 2026</div><h1>Good afternoon, Admin <span>✦</span></h1><p>Here&apos;s what&apos;s happening with your subscription business.</p></div>
        <div className="heading-actions"><button className="button secondary"><Download size={16} /> Export</button><button className="button primary"><CirclePlus size={17} /> New subscription</button></div>
      </section>

      <section className="metric-grid" aria-label="Business summary">
        {metrics.map(({ label, value, change, icon: Icon, tone }) => (
          <article className="metric-card" key={label}>
            <div className="metric-top"><span>{label}</span><div className={`metric-icon ${tone}`}><Icon size={18} /></div></div>
            <div className="metric-value">{value}</div><div className="metric-foot muted">{change}</div>
          </article>
        ))}
      </section>

      <section className="content-grid">
        <article className="panel revenue-panel">
          <div className="panel-heading"><div><h2>Revenue overview</h2><p>Revenue analytics will appear when billing is connected.</p></div><button className="select-button">Last 30 days <span>⌄</span></button></div>
          <div className="empty-chart"><div className="chart-illustration"><div className="chart-line"><span /><span /><span /><span /><span /><span /><span /></div></div><strong>Your revenue story starts here</strong><p>Once invoices and payments are flowing, you&apos;ll see trends and performance here.</p></div>
        </article>
        <article className="panel status-panel">
          <div className="panel-heading"><div><h2>System status</h2><p>Live connection check</p></div><span className="live-dot">LIVE</span></div>
          <div className="status-row"><span>FastAPI backend</span><span className={`status-pill ${systemStatus.api === 'running' ? 'ok' : systemStatus.api === 'checking' ? 'pending' : 'bad'}`}><i />{systemStatus.api}</span></div>
          <div className="status-row"><span>PostgreSQL database</span><span className={`status-pill ${systemStatus.database === 'connected' ? 'ok' : systemStatus.database === 'checking' ? 'pending' : 'bad'}`}><i />{systemStatus.database}</span></div>
          <div className="status-note">The status is fetched from your local API.</div>
          <div className="quick-links"><div><strong>Quick start</strong><span>Build your first module</span></div><ArrowUpRight size={17} /></div>
        </article>
      </section>

      <section className="panel activity-panel">
        <div className="panel-heading"><div><h2>Recent activity</h2><p>Updates across your subscription workspace.</p></div><button className="text-button">View all <ArrowUpRight size={15} /></button></div>
        <div className="empty-activity"><div className="activity-symbol"><ActivityIcon /></div><strong>No activity yet</strong><span>Customer, subscription and billing events will show up here.</span></div>
      </section>
      <footer className="page-footer">BRIGHTLOOP SUBSCRIPTION CLOUD <span>•</span> DEVELOPMENT FOUNDATION v0.1.0</footer>
    </div>
  )
}

function ActivityIcon() {
  return <ArrowDownRight size={19} />
}
