import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { LockKeyhole, Mail, UserRound, ArrowRight, ShieldCheck } from 'lucide-react'
import { useAuth } from '../auth/authContext'

function AuthLayout({ eyebrow, title, subtitle, children, footer }) {
  return <main className="auth-page">
    <section className="auth-card">
      <div className="auth-brand"><div className="brand-mark">B</div><div><strong>brightloop</strong><span>SUBSCRIPTION CLOUD</span></div></div>
      <div className="auth-eyebrow"><ShieldCheck size={13}/>{eyebrow}</div>
      <h1>{title}</h1><p className="auth-subtitle">{subtitle}</p>
      {children}
      <div className="auth-footer">{footer}</div>
    </section>
    <aside className="auth-aside"><div className="auth-aside-content"><span>BRIGHTLOOP WORKSPACE</span><h2>Subscriptions.<br/>Payments.<br/><em>In sync.</em></h2><p>A single workspace to manage plans, billing and customer relationships.</p><div className="auth-aside-bottom">SECURE ACCESS · ROLE-BASED WORKSPACE</div></div></aside>
  </main>
}

export function LoginPage() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  if (user) return <Navigate to="/" replace/>
  const update = (key, value) => setForm(old => ({ ...old, [key]: value }))
  async function submit(e) {
    e.preventDefault(); setError(''); setBusy(true)
    try { await login(form.email, form.password); navigate('/', { replace: true }) }
    catch (err) { setError(err.response?.data?.detail || 'Unable to sign in. Check your API connection and credentials.') }
    finally { setBusy(false) }
  }
  return <AuthLayout eyebrow="SECURE SIGN IN" title="Welcome back" subtitle="Sign in to continue to your Brightloop workspace." footer={<>New to Brightloop? <Link to="/register">Create a customer account</Link></>}>
    <form className="auth-form" onSubmit={submit}>
      <label>Email address<div className="auth-input"><Mail size={17}/><input type="email" required autoComplete="username" value={form.email} onChange={e => update('email', e.target.value)} placeholder="you@company.com"/></div></label>
      <label>Password<div className="auth-input"><LockKeyhole size={17}/><input type="password" required autoComplete="current-password" value={form.password} onChange={e => update('password', e.target.value)} placeholder="Enter your password"/></div></label>
      {error && <div className="auth-error" role="alert">{error}</div>}
      <button className="auth-submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}<ArrowRight size={16}/></button>
    </form>
  </AuthLayout>
}

export function RegisterPage() {
  const { user, register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ full_name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  if (user) return <Navigate to="/" replace/>
  const update = (key, value) => setForm(old => ({ ...old, [key]: value }))
  async function submit(e) {
    e.preventDefault(); setError(''); setBusy(true)
    try { await register(form); navigate('/', { replace: true }) }
    catch (err) { setError(err.response?.data?.detail || 'Unable to create account. Check your details and try again.') }
    finally { setBusy(false) }
  }
  return <AuthLayout eyebrow="CUSTOMER REGISTRATION" title="Create your account" subtitle="Register as a customer to access your subscriptions and invoices." footer={<>Already registered? <Link to="/login">Sign in</Link></>}>
    <form className="auth-form" onSubmit={submit}>
      <label>Full name<div className="auth-input"><UserRound size={17}/><input required minLength="2" maxLength="150" autoComplete="name" value={form.full_name} onChange={e => update('full_name', e.target.value)} placeholder="Your full name"/></div></label>
      <label>Email address<div className="auth-input"><Mail size={17}/><input type="email" required autoComplete="email" value={form.email} onChange={e => update('email', e.target.value)} placeholder="you@company.com"/></div></label>
      <label>Password<div className="auth-input"><LockKeyhole size={17}/><input type="password" required minLength="9" autoComplete="new-password" value={form.password} onChange={e => update('password', e.target.value)} placeholder="At least 9 characters"/></div><small>Include uppercase, lowercase and a special character.</small></label>
      {error && <div className="auth-error" role="alert">{error}</div>}
      <button className="auth-submit" disabled={busy}>{busy ? 'Creating account…' : 'Create customer account'}<ArrowRight size={16}/></button>
    </form>
  </AuthLayout>
}
