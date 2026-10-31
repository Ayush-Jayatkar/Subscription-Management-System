import { useEffect, useState } from 'react'
import { Activity, CalendarDays, Check, ChevronLeft, ChevronRight, Pause, Play, Plus, RefreshCw, RotateCcw, Send, X } from 'lucide-react'
import * as api from './p2Api'
import './p2.css'

const currency = v => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(Number(v || 0))
const statuses = ['DRAFT', 'QUOTATION', 'CONFIRMED', 'ACTIVE', 'CLOSED']
const today = new Date().toISOString().slice(0, 10)
const blank = { customer_id: '', plan_id: '', start_date: today, expiry_date: '', payment_terms_days: 15, product_id: '', quantity: 1, unit_price: '', tax_rule_id: '' }
function Badge({ status }) { return <span className={`p2-status ${String(status || '').toLowerCase()}`}>{status}</span> }
function Notice({ text, error }) { return text ? <div className={`finance-notice ${error ? 'error' : ''} p2-notice-text`}>{text}</div> : null }
function Stepper({ status }) { const at = statuses.indexOf(status); return <div className="p2-stepper">{statuses.map((s, i) => <div key={s} className={`p2-step ${i < at ? 'done' : ''} ${i === at ? 'current' : ''}`}><span className="p2-step-circle">{i < at ? <Check size={11}/> : i + 1}</span><span>{s[0] + s.slice(1).toLowerCase()}</span></div>)}</div> }
function TokenBar({ onSaved }) { const [token, setToken] = useState(localStorage.getItem('access_token') || ''); const [saved, setSaved] = useState(Boolean(localStorage.getItem('access_token'))); if (saved) return null; return <form className="p2-token" onSubmit={e => { e.preventDefault(); localStorage.setItem('access_token', token.trim()); setSaved(true); onSaved?.() }}><label htmlFor="p2-token">Access token</label><input id="p2-token" type="password" value={token} onChange={e => setToken(e.target.value)} placeholder="Paste login token" required/><button className="button primary" type="submit">Save</button></form> }
function Metric({ label, value, icon: Icon, tone }) { return <article className="metric-card"><div className="metric-top"><span>{label}</span><span className={`metric-icon ${tone}`}><Icon size={16}/></span></div><div className="metric-value">{value}</div><div className="metric-foot muted">Subscription records</div></article> }

export default function SubscriptionsPage() {
  const [items, setItems] = useState([]), [page, setPage] = useState(1), [total, setTotal] = useState(0), [filter, setFilter] = useState('')
  const [metrics, setMetrics] = useState({ total: 0, active: 0, open: 0, closed: 0 })
  const [loading, setLoading] = useState(true), [message, setMessage] = useState(''), [error, setError] = useState(false)
  const [selected, setSelected] = useState(null), [showForm, setShowForm] = useState(false), [form, setForm] = useState(blank), [busy, setBusy] = useState(false)
  async function load() {
    setLoading(true); setError(false)
    try {
      const [list, all, active, draft, quotation, closed] = await Promise.all([
        api.listSubscriptions({ page, page_size: 10, ...(filter ? { status: filter } : {}) }),
        api.listSubscriptions({ page: 1, page_size: 1 }), api.listSubscriptions({ status: 'ACTIVE', page: 1, page_size: 1 }),
        api.listSubscriptions({ status: 'DRAFT', page: 1, page_size: 1 }), api.listSubscriptions({ status: 'QUOTATION', page: 1, page_size: 1 }), api.listSubscriptions({ status: 'CLOSED', page: 1, page_size: 1 }),
      ])
      setItems(list.items || []); setTotal(list.total || 0); setMetrics({ total: all.total || 0, active: active.total || 0, open: (draft.total || 0) + (quotation.total || 0), closed: closed.total || 0 })
    } catch (e) { setMessage(api.errMsg(e)); setError(true) } finally { setLoading(false) }
  }
  async function detail(id) { try { setSelected(await api.getSubscription(id)); setMessage(''); setError(false) } catch (e) { setMessage(api.errMsg(e)); setError(true) } }
  useEffect(() => { load() }, [page, filter])
  const set = (key, value) => setForm(old => ({ ...old, [key]: value }))
  async function submit(e) {
    e.preventDefault(); setMessage(''); setError(false)
    if (form.expiry_date && form.expiry_date <= form.start_date) { setMessage('Expiry date must be after start date.'); setError(true); return }
    const terms = Number(form.payment_terms_days), quantity = Number(form.quantity)
    if (!form.customer_id || !form.plan_id || !form.product_id || quantity < 1 || terms < 0 || terms > 365) { setMessage('Check required fields, quantity, and payment terms (0–365).'); setError(true); return }
    setBusy(true)
    try {
      const created = await api.createSubscription({ customer_id: Number(form.customer_id), plan_id: Number(form.plan_id), start_date: form.start_date, expiry_date: form.expiry_date || null, payment_terms_days: terms, lines: [{ product_id: Number(form.product_id), quantity, unit_price: form.unit_price === '' ? null : Number(form.unit_price), tax_rule_id: form.tax_rule_id ? Number(form.tax_rule_id) : null }] })
      setMessage(`Subscription ${created.number || ''} created.`); setError(false); setForm(blank); setShowForm(false); await load(); await detail(created.id)
    } catch (e) { setMessage(api.errMsg(e)); setError(true) } finally { setBusy(false) }
  }
  async function act(action, success) { setBusy(true); setMessage(''); try { await action(); setMessage(success); setError(false); await load(); if (selected) await detail(selected.id) } catch (e) { setMessage(api.errMsg(e)); setError(true) } finally { setBusy(false) } }
  async function billing() { setBusy(true); setMessage(''); try { const r = await api.runBilling(); setMessage(`Billing complete: ${r.created?.length || 0} created, ${r.already_billed?.length || 0} already billed, ${r.auto_closed?.length || 0} auto-closed.`); setError(false); await load() } catch (e) { setMessage(api.errMsg(e)); setError(true) } finally { setBusy(false) } }
  const actions = selected?.status === 'DRAFT' ? [['Send as quotation', () => api.transition(selected.id, 'QUOTATION')]] : selected?.status === 'QUOTATION' ? [['Confirm', () => api.transition(selected.id, 'CONFIRMED')], ['Back to draft', () => api.transition(selected.id, 'DRAFT')]] : selected?.status === 'CONFIRMED' ? [['Activate', () => api.transition(selected.id, 'ACTIVE')]] : selected?.status === 'ACTIVE' ? [[selected.is_paused ? 'Resume' : 'Pause', () => selected.is_paused ? api.resume(selected.id) : api.pause(selected.id)], ['Renew', () => api.renew(selected.id)], ['Close', () => api.close(selected.id)]] : []
  return <div className="page-content">
    <TokenBar onSaved={load}/>
    <div className="page-heading"><div><div className="eyebrow">SUBSCRIPTIONS &amp; BILLING</div><h1>Subscriptions</h1><p>Manage recurring customer plans, lifecycle and billing.</p></div><div className="heading-actions"><button className="button secondary" onClick={billing} disabled={busy}><RefreshCw size={14}/> Run billing</button><button className="button primary" onClick={() => setShowForm(v => !v)}><Plus size={15}/> New subscription</button></div></div>
    <Notice text={message} error={error}/>
    <div className="metric-grid"><Metric label="Total" value={metrics.total} icon={Activity} tone="violet"/><Metric label="Active" value={metrics.active} icon={Play} tone="green"/><Metric label="Quotation / Draft" value={metrics.open} icon={Send} tone="blue"/><Metric label="Closed" value={metrics.closed} icon={X} tone="orange"/></div>
    {showForm && <form className="panel finance-form" onSubmit={submit}><div className="panel-heading"><div><h2>New subscription</h2><p>Enter customer, plan, dates and first order line.</p></div><button type="button" className="text-button" onClick={() => setShowForm(false)}>Close</button></div><div className="form-grid">
      <label>Customer ID<input required type="number" min="1" value={form.customer_id} onChange={e => set('customer_id', e.target.value)}/></label><label>Plan ID<input required type="number" min="1" value={form.plan_id} onChange={e => set('plan_id', e.target.value)}/></label>
      <label>Start date<input required type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)}/></label><label>Expiry date (optional)<input type="date" value={form.expiry_date} onChange={e => set('expiry_date', e.target.value)}/></label>
      <label>Payment terms (days)<input required type="number" min="0" max="365" value={form.payment_terms_days} onChange={e => set('payment_terms_days', e.target.value)}/></label><label>Product ID<input required type="number" min="1" value={form.product_id} onChange={e => set('product_id', e.target.value)}/></label>
      <label>Quantity<input required type="number" min="1" max="100000" value={form.quantity} onChange={e => set('quantity', e.target.value)}/></label><label>Unit price (optional)<input type="number" min="0" step="0.01" value={form.unit_price} onChange={e => set('unit_price', e.target.value)}/></label><label>Tax rule ID (optional)<input type="number" min="1" value={form.tax_rule_id} onChange={e => set('tax_rule_id', e.target.value)}/></label>
    </div><div className="form-actions"><button type="button" className="button secondary" onClick={() => setShowForm(false)}>Cancel</button><button className="button primary" disabled={busy}>{busy ? 'Saving…' : 'Create subscription'}</button></div></form>}
    <section className="panel"><div className="panel-heading"><div><h2>Subscription register</h2><p>{total} subscriptions</p></div><div className="p2-inline"><select aria-label="Filter status" value={filter} onChange={e => { setPage(1); setFilter(e.target.value) }}><option value="">All statuses</option>{statuses.map(s => <option key={s}>{s}</option>)}</select><button className="icon-action" onClick={load} title="Refresh"><RefreshCw size={15}/></button></div></div>
      {loading ? <div className="finance-empty">Loading subscriptions…</div> : error && !items.length ? <div className="finance-empty p2-error">{message || 'Could not load subscriptions.'}</div> : !items.length ? <div className="finance-empty">No subscriptions found.</div> : <div className="table-wrap"><table className="finance-table"><thead><tr><th>Number</th><th>Customer ID</th><th>Status</th><th>Start</th><th>Expiry</th><th>Next billing</th><th>Lines total</th><th/></tr></thead><tbody>{items.map(s => <tr key={s.id}><td><strong>{s.number || `#${s.id}`}</strong></td><td>{s.customer_id}</td><td><Badge status={s.status}/></td><td>{s.start_date}</td><td>{s.expiry_date || '—'}</td><td>{s.next_billing_date || '—'}</td><td>{currency((s.lines || []).reduce((a, l) => a + Number(l.amount || 0), 0))}</td><td><button className="text-button" onClick={() => detail(s.id)}>View</button></td></tr>)}</tbody></table></div>}
      <div className="pagination"><button className="button secondary" disabled={page <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft size={14}/> Prev</button><span>Page {page} of {Math.max(1, Math.ceil(total / 10))}</span><button className="button secondary" disabled={page * 10 >= total} onClick={() => setPage(p => p + 1)}>Next <ChevronRight size={14}/></button></div>
    </section>
    {selected && <section className="panel p2-detail"><div className="panel-heading"><div><div className="eyebrow">SUBSCRIPTION DETAIL</div><h2>{selected.number || `Subscription #${selected.id}`}</h2><p>Customer {selected.customer_id} · Plan {selected.plan_id} · {selected.billing_period}</p></div><button className="icon-action" onClick={() => setSelected(null)} title="Close"><X size={15}/></button></div><Stepper status={selected.status}/>
      <div className="p2-detail-grid"><div><h3 className="detail-title">Subscription lines</h3><div className="table-wrap"><table className="finance-table"><thead><tr><th>Product</th><th>Description</th><th>Qty</th><th>Unit price</th><th>Amount</th></tr></thead><tbody>{(selected.lines || []).map(l => <tr key={l.id}><td>{l.product_id}</td><td>{l.description}</td><td>{l.quantity}</td><td>{currency(l.unit_price)}</td><td>{currency(l.amount)}</td></tr>)}</tbody></table></div><div className="p2-actions">{actions.map(([label, action]) => <button className="button secondary" key={label} disabled={busy} onClick={() => act(action, `${label} complete.`)}>{label === 'Pause' ? <Pause size={14}/> : label === 'Resume' || label === 'Activate' ? <Play size={14}/> : label === 'Renew' ? <RotateCcw size={14}/> : <Check size={14}/>} {label}</button>)}</div></div>
        <div><h3 className="detail-title">Status history</h3>{selected.history?.length ? <div className="p2-timeline">{selected.history.map(h => <div className="p2-event" key={h.id}><strong>{h.from_status ? `${h.from_status} → ` : ''}{h.to_status}</strong><small>{new Date(h.changed_at).toLocaleString('en-IN')} · User {h.changed_by ?? 'system'}</small></div>)}</div> : <div className="finance-empty">No history yet.</div>}<div className="p2-portal-meta"><span><CalendarDays size={13}/> Terms: {selected.payment_terms_days} days</span><span>Auto close: {selected.auto_close ? 'Yes' : 'No'}</span></div></div>
      </div>
    </section>}
  </div>
}

