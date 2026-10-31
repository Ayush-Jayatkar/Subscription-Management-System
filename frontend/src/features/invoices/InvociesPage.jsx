
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Search, RefreshCw, FileText, Download, Mail, Eye,
  CheckCircle2, XCircle, Plus, X, CalendarDays,
  ReceiptText, AlertCircle, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { invoiceApi } from './invoiceApi'

const money = value =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(value || 0))

const formatDate = value => {
  if (!value) return '—'
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const statusClass = status => {
  const value = String(status || '').toUpperCase()
  if (value === 'PAID') return 'invoice-status paid'
  if (value === 'CANCELLED') return 'invoice-status cancelled'
  if (value === 'CONFIRMED') return 'invoice-status confirmed'
  return 'invoice-status draft'
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState([])
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [status, setStatus] = useState('')
  const [overdue, setOverdue] = useState(false)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [subscriptionId, setSubscriptionId] = useState('')

  const loadInvoices = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const data = await invoiceApi.list({
        page,
        page_size: pageSize,
        ...(status ? { status } : {}),
        ...(overdue ? { overdue: true } : {}),
      })

      setInvoices(data.items || [])
      setTotal(data.total || 0)
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        'Unable to load invoices. Check your connection and permissions.'
      )
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, status, overdue])

  useEffect(() => {
    loadInvoices()
  }, [loadInvoices])

  const filteredInvoices = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return invoices

    return invoices.filter(invoice =>
      String(invoice.number || invoice.invoice_number || invoice.id)
        .toLowerCase().includes(term) ||
      String(invoice.customer_name || '')
        .toLowerCase().includes(term) ||
      String(invoice.customer_email || '')
        .toLowerCase().includes(term)
    )
  }, [invoices, search])

  const visibleOutstanding = invoices.reduce(
    (sum, invoice) =>
      sum + Math.max(
        0,
        Number(invoice.total || 0) - Number(invoice.paid_amount || 0)
      ),
    0
  )

  const paidOnPage = invoices.filter(
    invoice => invoice.status === 'PAID'
  ).length

  async function showDetails(id) {
    setBusy(true)
    setError('')

    try {
      const invoice = await invoiceApi.get(id)
      setSelected(invoice)
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not load invoice details.')
    } finally {
      setBusy(false)
    }
  }

  async function runAction(action, successMessage) {
    if (!selected) return

    setBusy(true)
    setError('')
    setNotice('')

    try {
      await action(selected.id)
      setNotice(successMessage)

      const refreshed = await invoiceApi.get(selected.id)
      setSelected(refreshed)
      await loadInvoices()
    } catch (err) {
      setError(err.response?.data?.detail || 'The requested action failed.')
    } finally {
      setBusy(false)
    }
  }

  async function generateInvoice(event) {
    event.preventDefault()

    const id = Number(subscriptionId)
    if (!Number.isInteger(id) || id <= 0) {
      setError('Enter a valid subscription ID.')
      return
    }

    setBusy(true)
    setError('')
    setNotice('')

    try {
      const created = await invoiceApi.generate(id)
      setNotice(`Invoice ${created.number || created.id} generated successfully.`)
      setSubscriptionId('')
      setPage(1)
      await loadInvoices()
      setSelected(created)
    } catch (err) {
      setError(err.response?.data?.detail || 'Invoice generation failed.')
    } finally {
      setBusy(false)
    }
  }

  async function downloadPdf(id) {
    setBusy(true)
    setError('')

    try {
      await invoiceApi.downloadPdf(id)
      setNotice('Invoice PDF downloaded.')
    } catch (err) {
      setError(err.response?.data?.detail || 'PDF download failed.')
    } finally {
      setBusy(false)
    }
  }

  async function sendEmail(id) {
    setBusy(true)
    setError('')
    setNotice('')

    try {
      const result = await invoiceApi.send(id)
      setNotice(`Invoice email request completed: ${result.status || 'sent'}`)
    } catch (err) {
      setError(err.response?.data?.detail || 'Invoice email could not be sent.')
    } finally {
      setBusy(false)
    }
  }

  const pageCount = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div className="page-content">
      <section className="page-heading">
        <div>
          <div className="eyebrow">PERSON 2 · SUBSCRIPTIONS & BILLING</div>
          <h1>Invoices</h1>
          <p>Generate, review and manage recurring subscription invoices.</p>
        </div>

        <div className="heading-actions">
          <button
            className="button secondary"
            onClick={loadInvoices}
            disabled={loading}
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </section>

      {error && (
        <div className="invoice-alert error">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {notice && (
        <div className="invoice-alert success">
          <CheckCircle2 size={16} /> {notice}
        </div>
      )}

      <section className="metric-grid">
        <div className="metric-card">
          <div className="metric-top">
            Invoices matching filters
            <span className="metric-icon violet"><ReceiptText size={17} /></span>
          </div>
          <div className="metric-value">{total}</div>
          <div className="metric-foot muted">Total matching records</div>
        </div>

        <div className="metric-card">
          <div className="metric-top">
            Paid on this page
            <span className="metric-icon green"><CheckCircle2 size={17} /></span>
          </div>
          <div className="metric-value">{paidOnPage}</div>
          <div className="metric-foot muted">Current page only</div>
        </div>

        <div className="metric-card">
          <div className="metric-top">
            Outstanding on this page
            <span className="metric-icon orange"><FileText size={17} /></span>
          </div>
          <div className="metric-value">{money(visibleOutstanding)}</div>
          <div className="metric-foot muted">Calculated from listed invoices</div>
        </div>

        <div className="metric-card">
          <div className="metric-top">
            Current page
            <span className="metric-icon blue"><CalendarDays size={17} /></span>
          </div>
          <div className="metric-value">{page} / {pageCount}</div>
          <div className="metric-foot muted">{pageSize} records per page</div>
        </div>
      </section>

      <section className="panel invoice-generate-panel">
        <div className="panel-heading">
          <div>
            <h2>Generate invoice</h2>
            <p>Create an invoice for a subscription that is due for billing.</p>
          </div>
        </div>

        <form className="invoice-generate-form" onSubmit={generateInvoice}>
          <label>
            Subscription ID
            <input
              type="number"
              min="1"
              value={subscriptionId}
              onChange={event => setSubscriptionId(event.target.value)}
              placeholder="Enter subscription ID"
              required
            />
          </label>

          <button className="button primary" disabled={busy}>
            <Plus size={15} /> Generate invoice
          </button>
        </form>
      </section>

      <section className="panel invoice-list-panel">
        <div className="panel-heading">
          <div>
            <h2>Invoice register</h2>
            <p>Review invoice status, customer, billing dates and amounts.</p>
          </div>
        </div>

        <div className="invoice-toolbar">
          <label className="invoice-search">
            <Search size={15} />
            <input
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Search invoice or customer..."
            />
          </label>

          <select
            value={status}
            onChange={event => {
              setStatus(event.target.value)
              setPage(1)
            }}
          >
            <option value="">All statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PAID">Paid</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <label className="invoice-overdue-filter">
            <input
              type="checkbox"
              checked={overdue}
              onChange={event => {
                setOverdue(event.target.checked)
                setPage(1)
              }}
            />
            Overdue only
          </label>
        </div>

        <div className="table-wrap">
          <table className="invoice-table">
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Customer</th>
                <th>Invoice date</th>
                <th>Due date</th>
                <th>Total</th>
                <th>Paid</th>
                <th>Balance</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" className="invoice-empty">Loading invoices…</td>
                </tr>
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan="9" className="invoice-empty">
                    No invoices found. Generate one from a due subscription.
                  </td>
                </tr>
              ) : filteredInvoices.map(invoice => {
                const paid = Number(invoice.paid_amount || 0)
                const totalAmount = Number(invoice.total || 0)
                const balance = Math.max(0, totalAmount - paid)
                const isOverdue =
                  invoice.due_date &&
                  new Date(`${invoice.due_date}T00:00:00`) < new Date() &&
                  balance > 0 &&
                  invoice.status === 'CONFIRMED'

                return (
                  <tr key={invoice.id}>
                    <td>
                      <strong>{invoice.number || invoice.invoice_number || `INV-${invoice.id}`}</strong>
                      <small>#{invoice.id}</small>
                    </td>
                    <td>
                      <strong>{invoice.customer_name || `Customer #${invoice.customer_id}`}</strong>
                      <small>{invoice.customer_email || '—'}</small>
                    </td>
                    <td>{formatDate(invoice.invoice_date)}</td>
                    <td>
                      {formatDate(invoice.due_date)}
                      {isOverdue && <small className="overdue-label">Overdue</small>}
                    </td>
                    <td>{money(totalAmount)}</td>
                    <td>{money(paid)}</td>
                    <td>{money(balance)}</td>
                    <td>
                      <span className={statusClass(invoice.status)}>
                        {invoice.status}
                      </span>
                    </td>
                    <td>
                      <div className="invoice-row-actions">
                        <button title="View details" onClick={() => showDetails(invoice.id)}>
                          <Eye size={15} />
                        </button>
                        <button title="Download PDF" onClick={() => downloadPdf(invoice.id)}>
                          <Download size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="invoice-pagination">
          <span>Showing {invoices.length} of {total} invoices</span>
          <div>
            <button
              disabled={page <= 1 || loading}
              onClick={() => setPage(value => Math.max(1, value - 1))}
            >
              <ChevronLeft size={15} /> Previous
            </button>
            <span>{page} / {pageCount}</span>
            <button
              disabled={page >= pageCount || loading}
              onClick={() => setPage(value => Math.min(pageCount, value + 1))}
            >
              Next <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </section>

      {selected && (
        <div className="invoice-modal-backdrop" onClick={() => setSelected(null)}>
          <section
            className="invoice-modal"
            onClick={event => event.stopPropagation()}
          >
            <div className="invoice-modal-header">
              <div>
                <div className="eyebrow">INVOICE DETAILS</div>
                <h2>{selected.number || selected.invoice_number || `INV-${selected.id}`}</h2>
                <span className={statusClass(selected.status)}>{selected.status}</span>
              </div>
              <button className="invoice-close" onClick={() => setSelected(null)}>
                <X size={19} />
              </button>
            </div>

            <div className="invoice-detail-grid">
              <div>
                <span>Customer</span>
                <strong>{selected.customer_name || `Customer #${selected.customer_id}`}</strong>
                <small>{selected.customer_email || '—'}</small>
              </div>
              <div>
                <span>Subscription ID</span>
                <strong>#{selected.subscription_id}</strong>
              </div>
              <div>
                <span>Invoice date</span>
                <strong>{formatDate(selected.invoice_date)}</strong>
              </div>
              <div>
                <span>Due date</span>
                <strong>{formatDate(selected.due_date)}</strong>
              </div>
            </div>

            <div className="table-wrap">
              <table className="invoice-table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Qty</th>
                    <th>Unit price</th>
                    <th>Tax</th>
                    <th>Line total</th>
                  </tr>
                </thead>
                <tbody>
                  {(selected.lines || []).map(line => (
                    <tr key={line.id}>
                      <td>{line.description}</td>
                      <td>{line.quantity}</td>
                      <td>{money(line.unit_price)}</td>
                      <td>{Number(line.tax_rate || 0)}%</td>
                      <td>{money(line.line_total)}</td>
                    </tr>
                  ))}
                  {(selected.lines || []).length === 0 && (
                    <tr><td colSpan="5" className="invoice-empty">No invoice lines available.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="invoice-totals">
              <div><span>Subtotal</span><strong>{money(selected.subtotal)}</strong></div>
              <div><span>Discount</span><strong>− {money(selected.discount_total)}</strong></div>
              <div><span>Tax</span><strong>{money(selected.tax_total)}</strong></div>
              <div><span>Total</span><strong>{money(selected.total)}</strong></div>
              <div><span>Paid amount</span><strong>{money(selected.paid_amount)}</strong></div>
              <div className="balance-total">
                <span>Outstanding</span>
                <strong>{money(Number(selected.total || 0) - Number(selected.paid_amount || 0))}</strong>
              </div>
            </div>

            <div className="invoice-modal-actions">
              <button
                className="button secondary"
                disabled={busy}
                onClick={() => downloadPdf(selected.id)}
              >
                <Download size={14} /> PDF
              </button>

              <button
                className="button secondary"
                disabled={busy || selected.status === 'CANCELLED'}
                onClick={() => sendEmail(selected.id)}
              >
                <Mail size={14} /> Send email
              </button>

              {selected.status === 'DRAFT' && (
                <button
                  className="button primary"
                  disabled={busy}
                  onClick={() => runAction(invoiceApi.confirm, 'Invoice confirmed.')}
                >
                  <CheckCircle2 size={14} /> Confirm
                </button>
              )}

              {['DRAFT', 'CONFIRMED'].includes(selected.status) &&
                Number(selected.paid_amount || 0) === 0 && (
                  <button
                    className="button danger"
                    disabled={busy}
                    onClick={() => {
                      if (window.confirm('Cancel this invoice?')) {
                        runAction(invoiceApi.cancel, 'Invoice cancelled.')
                      }
                    }}
                  >
                    <XCircle size={14} /> Cancel
                  </button>
                )}
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
