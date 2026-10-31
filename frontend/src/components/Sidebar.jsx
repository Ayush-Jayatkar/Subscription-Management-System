import { NavLink } from 'react-router-dom'
import {
  Activity, BarChart3, CreditCard, FileText, Gauge, Layers3,
  LayoutDashboard, Package, Percent, Settings, Users,
} from 'lucide-react'

const navigation = [
  { label: 'Overview', path: '/', icon: LayoutDashboard },
  { label: 'Customers', path: '/customers', icon: Users },
  { label: 'Products', path: '/products', icon: Package },
  { label: 'Plans', path: '/plans', icon: Layers3 },
  { label: 'Quotations', path: '/quotations', icon: FileText },
  { label: 'Subscriptions', path: '/subscriptions', icon: Activity },
  { label: 'Invoices', path: '/invoices', icon: FileText },
  { label: 'Payments', path: '/payments', icon: CreditCard },
  { label: 'Discounts', path: '/discounts', icon: Percent },
  { label: 'Reports', path: '/reports', icon: BarChart3 },
]

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand-lockup">
        <div className="brand-mark">B</div>
        <div><strong>brightloop</strong><span>SUBSCRIPTION CLOUD</span></div>
      </div>
      <div className="workspace-label">WORKSPACE</div>
      <nav className="nav-list" aria-label="Main navigation">
        {navigation.map(({ label, path, icon: Icon }) => (
          <NavLink key={path} to={path} end={path === '/'} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            <Icon size={18} strokeWidth={1.8} /><span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <NavLink to="/settings" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
          <Settings size={18} strokeWidth={1.8} /><span>Settings</span>
        </NavLink>
        <div className="help-card"><div className="help-icon">?</div><div><strong>Need a hand?</strong><span>Help centre & support</span></div></div>
        <div className="profile-row"><div className="avatar">AD</div><div><strong>Admin User</strong><span>Administrator</span></div><span className="profile-dots">•••</span></div>
      </div>
    </aside>
  )
}
