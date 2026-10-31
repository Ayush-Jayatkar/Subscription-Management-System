import { useEffect, useMemo, useState } from 'react'
import { BadgePercent, CreditCard, IndianRupee, Plus, RefreshCw, Search, TrendingUp, Wallet, AlertCircle } from 'lucide-react'
import { financeApi } from './financeApi'

const currency = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(Number(value || 0))
const today = new Date().toISOString().slice(0, 10)
const initialDiscount = { name: '', description: '', discount_type: 'percentage', value: '', scope: 'subscription', product_ids: [], minimum_purchase: '0', minimum_quantity: 1, starts_at: today, ends_at: '', usage_limit: '' }

function PageHeader({ eyebrow = 'FINANCE WORKSPACE', title, description, action }) {
  return <div className="page-heading"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>{action}</div>
}
function Notice({ message, error }) { return message ? <div className={`finance-notice ${error ? 'error' : ''}`}>{message}</div> : null }
function Empty({ children }) { return <div className="finance-empty">{children}</div> }

export function DiscountsPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(initialDiscount)
  const [message, setMessage] = useState('')
  const [error, setError] = useState(false)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)

  async function load() {
    setLoading(true)
    try { setItems(await financeApi.discounts({ skip: page * 10, limit: 10 })); setError(false) }
    catch { setMessage('Could not load discounts. Check that the API and database are running.'); setError(true) }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [page])
  const filtered = useMemo(() => items.filter(x => x.name.toLowerCase().includes(search.toLowerCase())), [items, search])
  const set = (key, value) => setForm(old => ({ ...old, [key]: value }))

  async function submit(e) {
    e.preventDefault(); setMessage('')
    try {
      const payload = { ...form, value: Number(form.value), minimum_purchase: Number(form.minimum_purchase), minimum_quantity: Number(form.minimum_quantity), usage_limit: form.usage_limit ? Number(form.usage_limit) : null, ends_at: form.ends_at || null, product_ids: form.scope === 'product' ? form.product_ids.split(',').map(v => Number(v.trim())).filter(Boolean) : [] }
      await financeApi.createDiscount(payload)
      setMessage('Discount rule created successfully.'); setForm(initialDiscount); setShowForm(false); load()
    } catch (err) { setMessage(err.response?.data?.detail || 'Unable to create discount. Verify the API and input values.'); setError(true) }
  }

  return <div className="page-content">
    <PageHeader title="Discounts" description="Create and manage promotional rules for products and subscriptions." action={<button className="button primary" onClick={() => setShowForm(v => !v)}><Plus size={15}/> New discount</button>} />
    <Notice message={message} error={error}/>
    {showForm && <form className="panel finance-form" onSubmit={submit}>
      <div className="panel-heading"><div><h2>Create discount rule</h2><p>Set eligibility, validity and usage limits.</p></div><button type="button" className="text-button" onClick={() => setShowForm(false)}>Close</button></div>
      <div className="form-grid">
        <label>Discount name<input required minLength="2" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Annual plan offer"/></label>
        <label>Discount type<select value={form.discount_type} onChange={e => set('discount_type', e.target.value)}><option value="percentage">Percentage</option><option value="fixed">Fixed amount</option></select></label>
        <label>Value<input required type="number" min="0.01" max={form.discount_type === 'percentage' ? 100 : undefined} step="0.01" value={form.value} onChange={e => set('value', e.target.value)} placeholder={form.discount_type === 'percentage' ? '10' : '500'}/></label>
        <label>Applies to<select value={form.scope} onChange={e => set('scope', e.target.value)}><option value="subscription">Whole subscription</option><option value="product">Specific products</option></select></label>
        {form.scope === 'product' && <label className="wide">Product IDs (comma separated)<input value={form.product_ids} onChange={e => set('product_ids', e.target.value)} placeholder="e.g. 1, 2, 3"/></label>}
        <label>Minimum purchase (₹)<input type="number" min="0" step="0.01" value={form.minimum_purchase} onChange={e => set('minimum_purchase', e.target.value)}/></label>
        <label>Minimum quantity<input type="number" min="1" value={form.minimum_quantity} onChange={e => set('minimum_quantity', e.target.value)}/></label>
        <label>Starts on<input required type="date" value={form.starts_at} onChange={e => set('starts_at', e.target.value)}/></label>
        <label>Ends on<input type="date" value={form.ends_at} onChange={e => set('ends_at', e.target.value)}/></label>
        <label>Usage limit<input type="number" min="1" value={form.usage_limit} onChange={e => set('usage_limit', e.target.value)} placeholder="Unlimited"/></label>
      </div>
      <div className="form-actions"><button type="button" className="button secondary" onClick={() => setShowForm(false)}>Cancel</button><button className="button primary" type="submit">Save discount</button></div>
    </form>}
    <section className="panel">
      <div className="panel-heading"><div><h2>Discount rules</h2><p>{items.length} rules on this page</p></div><div className="table-tools"><div className="inline-search"><Search size={14}/><input placeholder="Search discounts" value={search} onChange={e => setSearch(e.target.value)}/></div><button className="icon-action" onClick={load} title="Refresh"><RefreshCw size={15}/></button></div></div>
      {loading ? <Empty>Loading discount rules…</Empty> : filtered.length === 0 ? <Empty>No discount rules found.</Empty> : <div className="table-wrap"><table className="finance-table"><thead><tr><th>Rule</th><th>Value</th><th>Scope</th><th>Validity</th><th>Usage</th><th>Status</th></tr></thead><tbody>{filtered.map(d => <tr key={d.id}><td><strong>{d.name}</strong><small>{d.minimum_purchase > 0 ? `Min. purchase ${currency(d.minimum_purchase)}` : 'No minimum purchase'}</small></td><td>{d.discount_type === 'percentage' ? `${d.value}%` : currency(d.value)}</td><td>{d.scope === 'product' ? 'Selected products' : 'Subscription'}</td><td>{d.starts_at} – {d.ends_at || 'No expiry'}</td><td>{d.usage_count}{d.usage_limit ? ` / ${d.usage_limit}` : ' / ∞'}</td><td><span className="status-pill active">Configured</span></td></tr>)}</tbody></table></div>}
      <div className="pagination"><button className="button secondary" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Previous</button><span>Page {page + 1}</span><button className="button secondary" disabled={items.length < 10} onClick={() => setPage(p => p + 1)}>Next</button></div>
    </section>
  </div>
}

export function PaymentsPage() {
  const [items, setItems] = useState([])
  const [form, setForm] = useState({ invoice_id: '', method: 'Bank transfer', amount: '', paid_at: new Date().toISOString().slice(0, 16), note: '', reference: '' })
  const [message, setMessage] = useState('')
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)
  const [invoiceFilter, setInvoiceFilter] = useState('')
  async function load() {
    setLoading(true)
    try { setItems(await financeApi.payments(invoiceFilter ? { invoice_id: Number(invoiceFilter), limit: 100 } : { limit: 100 })) }
    catch { setMessage('Could not load payments.'); setError(true) }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [invoiceFilter])
  const set = (key, value) => setForm(old => ({ ...old, [key]: value }))
  async function submit(e) {
    e.preventDefault(); setMessage('')
    try {
      await financeApi.createPayment({ ...form, invoice_id: Number(form.invoice_id), amount: Number(form.amount), paid_at: new Date(form.paid_at).toISOString() })
      setMessage('Payment recorded. Invoice balance/status synchronization will be completed when Person 2 provides the invoice service.')
      setError(false); setForm(old => ({ ...old, invoice_id: '', amount: '', note: '', reference: '' })); load()
    } catch (err) { setMessage(err.response?.data?.detail || 'Unable to record payment.'); setError(true) }
  }
  return <div className="page-content">
    <PageHeader title="Payments" description="Record incoming payments and review payment history."/>
    <Notice message={message} error={error}/>
    <div className="finance-columns">
      <form className="panel finance-form compact-form" onSubmit={submit}>
        <div className="panel-heading"><div><h2>Record a payment</h2><p>Link a payment to an invoice.</p></div><div className="metric-icon green"><CreditCard size={17}/></div></div>
        <div className="form-grid single">
          <label>Invoice ID<input required type="number" min="1" value={form.invoice_id} onChange={e => set('invoice_id', e.target.value)} placeholder="Invoice ID from Person 2"/></label>
          <label>Payment method<select value={form.method} onChange={e => set('method', e.target.value)}><option>Bank transfer</option><option>UPI</option><option>Card</option><option>Cash</option><option>Cheque</option><option>Other</option></select></label>
          <label>Amount (₹)<input required type="number" min="0.01" step="0.01" value={form.amount} onChange={e => set('amount', e.target.value)} placeholder="0.00"/></label>
          <label>Payment date<input required type="datetime-local" value={form.paid_at} onChange={e => set('paid_at', e.target.value)}/></label>
          <label>Reference (optional)<input value={form.reference} onChange={e => set('reference', e.target.value)} placeholder="Transaction reference"/></label>
          <label>Note (optional)<textarea rows="2" value={form.note} onChange={e => set('note', e.target.value)} placeholder="Add a note"/></label>
        </div>
        <button className="button primary full-button" type="submit"><Plus size={15}/> Record payment</button>
      </form>
      <section className="panel payment-history">
        <div className="panel-heading"><div><h2>Payment history</h2><p>Recorded transactions</p></div><button className="icon-action" onClick={load}><RefreshCw size={15}/></button></div>
        <div className="filter-row"><label>Filter by invoice ID<input type="number" min="1" value={invoiceFilter} onChange={e => setInvoiceFilter(e.target.value)} placeholder="All invoices"/></label></div>
        {loading ? <Empty>Loading payments…</Empty> : items.length === 0 ? <Empty>No payments recorded yet.</Empty> : <div className="table-wrap"><table className="finance-table"><thead><tr><th>Invoice</th><th>Method</th><th>Date</th><th>Amount</th></tr></thead><tbody>{items.map(p => <tr key={p.id}><td>#{p.invoice_id}</td><td>{p.method}<small>{p.reference || p.note || '—'}</small></td><td>{new Date(p.paid_at).toLocaleDateString('en-IN')}</td><td><strong>{currency(p.amount)}</strong></td></tr>)}</tbody></table></div>}
      </section>
    </div>
  </div>
}

export function FinanceDashboardPage() {
  const [summary, setSummary] = useState(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  async function load() {
    setLoading(true)
    try { setSummary(await financeApi.summary()); setMessage('') }
    catch { setMessage('Finance summary API is unavailable. Start the backend and connect the database.') }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])
  const cards = [
    { label: 'Active subscriptions', value: summary?.active_subscriptions ?? '—', icon: TrendingUp, tone: 'violet', hint: 'Connects to Person 2' },
    { label: 'Revenue received', value: currency(summary?.revenue_received), icon: IndianRupee, tone: 'green', hint: 'Sum of recorded payments' },
    { label: 'Amount owed', value: summary ? currency(summary.amount_owed) : '—', icon: Wallet, tone: 'blue', hint: 'Connects to invoice balances' },
    { label: 'Overdue invoices', value: summary?.overdue_invoices ?? '—', icon: AlertCircle, tone: 'orange', hint: 'Connects to invoice due dates' },
  ]
  return <div className="page-content">
    <PageHeader title="Finance overview" description="Track collections, outstanding balances and subscription performance." action={<button className="button secondary" onClick={load}><RefreshCw size={14}/> Refresh</button>}/>
    {message && <Notice message={message} error/>}
    <div className="metric-grid">{cards.map(({ label, value, icon: Icon, tone, hint }) => <div className="metric-card" key={label}><div className="metric-top"><span>{label}</span><div className={`metric-icon ${tone}`}><Icon size={17}/></div></div><div className="metric-value">{loading ? '…' : value}</div><div className="metric-foot muted">{hint}</div></div>)}</div>
    <div className="finance-columns dashboard-columns">
      <section className="panel"><div className="panel-heading"><div><h2>Finance reporting</h2><p>Operational metrics for the billing period</p></div></div><div className="report-list"><div><span>Payments recorded</span><strong>{summary ? currency(summary.revenue_received) : '—'}</strong></div><div><span>Outstanding invoices</span><strong>{summary ? currency(summary.amount_owed) : '—'}</strong></div><div><span>Overdue invoices</span><strong>{summary?.overdue_invoices ?? '—'}</strong></div><div><span>Active subscriptions</span><strong>{summary?.active_subscriptions ?? '—'}</strong></div></div><p className="integration-note">{summary?.note || 'Invoice and subscription totals will populate after Person 2 integration.'}</p></section>
      <section className="panel"><div className="panel-heading"><div><h2>Next integration steps</h2><p>Complete the shared financial workflow</p></div><div className="metric-icon violet"><BadgePercent size={17}/></div></div><div className="check-list"><div><span className="check-dot done">✓</span><span>Discount rules and eligibility calculation</span></div><div><span className="check-dot done">✓</span><span>Payment recording API</span></div><div><span className="check-dot pending">2</span><span>Invoice balance and payment status sync</span></div><div><span className="check-dot pending">3</span><span>Overdue invoice and subscription aggregates</span></div></div></section>
    </div>
  </div>
}
