import { NavLink } from 'react-router-dom'
import {
  Activity, BarChart3, CreditCard, FileText, LayoutDashboard, Package,
  Percent, Settings, Users, Layers3, UserRound, ReceiptText, ShieldCheck, UserPlus, LogOut,
} from 'lucide-react'
import { useAuth } from '../auth/AuthContext'

export default function Sidebar() {
  const { user, logout } = useAuth()
  const role = user?.role
  const admin = role === 'ADMIN'
  const staff = role === 'INTERNAL_STAFF'
  const groups = [
    ...(admin ? [{ title: 'IDENTITY & CATALOG', items: [
      { label: 'Customers & Access', path: '/customers', icon: Users },
      { label: 'Products & Variants', path: '/products', icon: Package },
      { label: 'Plans', path: '/plans', icon: Layers3 },
      { label: 'Quotation Templates', path: '/quotations', icon: FileText },
      { label: 'Staff Access', path: '/staff', icon: UserPlus },
    ]}] : []),
    ...(!role || admin || staff ? [{ title: 'SUBSCRIPTIONS & BILLING', items: [
      { label: 'Subscriptions', path: '/subscriptions', icon: Activity },
      { label: 'Invoices', path: '/invoices', icon: ReceiptText },
    ]}] : []),
    ...(admin || staff ? [{ title: 'FINANCE', items: [
      ...(admin ? [{ label: 'Discount Rules', path: '/discounts', icon: Percent }] : []),
      { label: 'Payments', path: '/payments', icon: CreditCard },
      { label: 'Finance Reports', path: '/reports', icon: BarChart3 },
    ]}] : []),
    ...(role === 'CUSTOMER' ? [{ title: 'CUSTOMER PORTAL', items: [
      { label: 'My Subscriptions', path: '/portal/my-subscriptions', icon: UserRound },
      { label: 'My Invoices', path: '/portal/my-invoices', icon: ReceiptText },
    ]}] : []),
  ]
  const initials = (user?.full_name || 'User').split(' ').map(x => x[0]).slice(0,2).join('').toUpperCase()
  return <aside className="sidebar">
    <div className="brand-lockup"><div className="brand-mark">B</div><div><strong>brightloop</strong><span>SUBSCRIPTION CLOUD</span></div></div>
    <div className="workspace-label">WORKSPACE</div>
    <nav className="nav-groups" aria-label="Main navigation">
      <NavLink to="/" end className={({ isActive }) => `nav-link overview-link${isActive ? ' active' : ''}`}><LayoutDashboard size={17}/><span>Overview</span></NavLink>
      {groups.map(group => <section className="nav-group" key={group.title}>
        <div className="nav-group-title">{group.title}</div>
        {group.items.map(({ label, path, icon: Icon }) => <NavLink key={path} to={path} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}><Icon size={17} strokeWidth={1.8}/><span>{label}</span></NavLink>)}
      </section>)}
    </nav>
    <div className="sidebar-bottom">
      {(admin || staff) && <NavLink to="/settings" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}><Settings size={17}/><span>Settings</span></NavLink>}
      <div className="profile-row"><div className="avatar">{initials}</div><div className="profile-details"><strong>{user?.full_name}</strong><span><ShieldCheck size={10} style={{display:'inline',verticalAlign:'-1px'}}/> {role?.replace('_',' ')}</span></div><button className="logout-button" onClick={logout} title="Sign out" aria-label="Sign out"><LogOut size={15}/></button></div>
    </div>
  </aside>
}
