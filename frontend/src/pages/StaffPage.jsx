import { useState } from 'react'
import { UserPlus, ShieldCheck } from 'lucide-react'
import api from '../services/api'

export default function StaffPage() {
  const [form, setForm] = useState({ full_name: '', email: '', password: '' })
  const [message, setMessage] = useState('')
  const [error, setError] = useState(false)
  const [busy, setBusy] = useState(false)
  const set = (key, value) => setForm(old => ({ ...old, [key]: value }))
  async function submit(e) {
    e.preventDefault(); setBusy(true); setMessage('')
    try {
      const { data } = await api.post('/auth/staff', form)
      setMessage(`Staff account created for ${data.full_name} (${data.email}).`)
      setForm({ full_name: '', email: '', password: '' }); setError(false)
    } catch (err) {
      setMessage(err.response?.data?.detail || 'Unable to create staff account.')
      setError(true)
    } finally { setBusy(false) }
  }
  return <div className="page-content">
    <div className="page-heading"><div><div className="eyebrow">ADMINISTRATION</div><h1>Staff access</h1><p>Create internal staff accounts. Only administrators can access this page.</p></div></div>
    {message && <div className={`finance-notice ${error ? 'error' : ''}`}>{message}</div>}
    <section className="panel staff-panel">
      <div className="panel-heading"><div><h2>Create internal staff account</h2><p>The new user receives the INTERNAL_STAFF role.</p></div><div className="metric-icon violet"><UserPlus size={18}/></div></div>
      <form onSubmit={submit}>
        <div className="form-grid">
          <label>Full name<input required minLength="2" maxLength="150" value={form.full_name} onChange={e => set('full_name', e.target.value)} placeholder="Staff member name"/></label>
          <label>Email address<input required type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="staff@company.com"/></label>
          <label className="wide">Temporary password<input required type="password" minLength="9" value={form.password} onChange={e => set('password', e.target.value)} placeholder="Uppercase, lowercase and special character"/></label>
        </div>
        <p className="staff-hint"><ShieldCheck size={14}/> Staff accounts are created with operational permissions, not administrator access.</p>
        <div className="form-actions"><button className="button primary" disabled={busy}><UserPlus size={15}/>{busy ? 'Creating…' : 'Create staff account'}</button></div>
      </form>
    </section>
  </div>
}
