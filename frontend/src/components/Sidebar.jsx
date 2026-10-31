import { NavLink } from 'react-router-dom'
import {
  Activity, BarChart3, CreditCard, FileText, LayoutDashboard, Package,
  Percent, Settings, Users, Layers3, UserRound, ReceiptText, ShieldCheck,
} from 'lucide-react'

const groups = [
  { title: 'PERSON 1 · IDENTITY & CATALOG', items: [
    { label: 'Customers & Access', path: '/customers', icon: Users },
    { label: 'Products & Variants', path: '/products', icon: Package },
    { label: 'Plans', path: '/plans', icon: Layers3 },
    { label: 'Quotation Templates', path: '/quotations', icon: FileText },
  ]},
  { title: 'PERSON 2 · SUBSCRIPTIONS & BILLING', items: [
    { label: 'Subscriptions', path: '/subscriptions', icon: Activity },
    { label: 'Invoices', path: '/invoices', icon: ReceiptText },
  ]},
  { title: 'PERSON 3 · FINANCE', items: [
    { label: 'Discount Rules', path: '/discounts', icon: Percent },
    { label: 'Payments', path: '/payments', icon: CreditCard },
    { label: 'Finance Reports', path: '/reports', icon: BarChart3 },
  ]},
]

export default function Sidebar() {
  return <aside className="sidebar">
    <div className="brand-lockup"><div className="brand-mark">B</div><div><strong>brightloop</strong><span>SUBSCRIPTION CLOUD</span></div></div>
    <div className="workspace-label">WORKSPACE</div>
    <nav className="nav-groups" aria-label="Main navigation">
      <NavLink to="/" end className={({ isActive }) => `nav-link overview-link${isActive ? ' active' : ''}`}><LayoutDashboard size={17}/><span>Overview</span></NavLink>
      {groups.map(group => <section className="nav-group" key={group.title}>
        <div className="nav-group-title">{group.title}</div>
        {group.items.map(({ label, path, icon: Icon }) => <NavLink key={path} to={path} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}><Icon size={17} strokeWidth={1.8}/><span>{label}</span></NavLink>)}
      </section>)}
      <section className="nav-group"><div className="nav-group-title">CUSTOMER PORTAL</div>
        <NavLink to="/portal/my-subscriptions" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}><UserRound size={17}/><span>My Subscriptions</span></NavLink>
        <NavLink to="/portal/my-invoices" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}><ReceiptText size={17}/><span>My Invoices</span></NavLink>
      </section>
    </nav>
    <div className="sidebar-bottom">
      <NavLink to="/settings" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}><Settings size={17}/><span>Settings</span></NavLink>
      <div className="help-card"><div className="help-icon">?</div><div><strong>Need a hand?</strong><span>Help centre & support</span></div></div>
      <div className="profile-row"><div className="avatar">AD</div><div><strong>Admin User</strong><span><ShieldCheck size={10} style={{display:'inline',verticalAlign:'-1px'}}/> Administrator</span></div><span className="profile-dots">•••</span></div>
    </div>
  </aside>
}
