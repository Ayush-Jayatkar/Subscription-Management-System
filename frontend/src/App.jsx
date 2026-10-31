import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import Dashboard from './pages/Dashboard'
import Placeholder from './pages/Placeholder'
import StaffPage from './pages/StaffPage'
import { LoginPage, RegisterPage } from './pages/AuthPages'
import { DiscountsPage, PaymentsPage, FinanceDashboardPage } from './features/finance/FinancePages'
import { useAuth } from './auth/AuthContext'
import InvoicesPage from './features/invoices/InvociesPage'

const pages = [
  ['customers', 'Customers & Access'], ['products', 'Products & Variants'], ['plans', 'Plans'],
  ['quotations', 'Quotation Templates'], ['subscriptions', 'Subscriptions'], ['invoices', 'Invoices'],
  ['payments', 'Payments'], ['discounts', 'Discount Rules'], ['reports', 'Finance Reports'],
  ['portal/my-subscriptions', 'My Subscriptions'], ['portal/my-invoices', 'My Invoices'],
]

function Protected({ children, roles }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <div className="auth-loading">Loading your workspace…</div>
  if (!user) return <Navigate to="/login" state={{ from: location }} replace/>
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace/>
  return children
}

function Workspace() {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <div className="auth-loading">Loading your workspace…</div>
  if (!user) return <Navigate to="/login" state={{ from: location }} replace/>

  const current = pages.find(([path]) => `/${path}` === location.pathname)
  const title = location.pathname === '/' ? 'Overview' : location.pathname === '/staff' ? 'Staff Access' : current?.[1] || 'Overview'

  return <div className="app-shell">
    <Sidebar/>
    <main className="main-area">
      <Topbar title={title}/>
      <Routes>
        <Route path="/" element={<Dashboard/>}/>
        <Route path="/staff" element={<Protected roles={['ADMIN']}><StaffPage/></Protected>}/>
        <Route path="/discounts" element={<Protected roles={['ADMIN']}><DiscountsPage/></Protected>}/>
        <Route path="/payments" element={<Protected roles={['ADMIN','INTERNAL_STAFF']}><PaymentsPage/></Protected>}/>
        <Route path="/reports" element={<Protected roles={['ADMIN','INTERNAL_STAFF']}><FinanceDashboardPage/></Protected>}/>
        <Route path="/customers" element={<Protected roles={['ADMIN']}><Placeholder title="Customers & Access" moduleKey="customers"/></Protected>}/>
        <Route path="/products" element={<Protected roles={['ADMIN']}><Placeholder title="Products & Variants" moduleKey="products"/></Protected>}/>
        <Route path="/plans" element={<Protected roles={['ADMIN']}><Placeholder title="Plans" moduleKey="plans"/></Protected>}/>
        <Route path="/quotations" element={<Protected roles={['ADMIN','INTERNAL_STAFF']}><Placeholder title="Quotation Templates" moduleKey="quotations"/></Protected>}/>
        <Route path="/subscriptions" element={<Protected roles={['ADMIN','INTERNAL_STAFF']}><Placeholder title="Subscriptions" moduleKey="subscriptions"/></Protected>}/>
<Route
  path="/invoices"
  element={
    <Protected roles={['ADMIN', 'INTERNAL_STAFF']}>
      <InvoicesPage />
    </Protected>
  }
/>        <Route path="/portal/my-subscriptions" element={<Protected roles={['CUSTOMER']}><Placeholder title="My Subscriptions" moduleKey="portal/my-subscriptions"/></Protected>}/>
        <Route path="/portal/my-invoices" element={<Protected roles={['CUSTOMER']}><Placeholder title="My Invoices" moduleKey="portal/my-invoices"/></Protected>}/>
        <Route path="/settings" element={<Protected roles={['ADMIN','INTERNAL_STAFF']}><Placeholder title="Settings" moduleKey="settings"/></Protected>}/>
        <Route path="*" element={<Navigate to="/" replace/>}/>
      </Routes>
    </main>
  </div>
}

export default function App() {
  return <BrowserRouter><Routes>
    <Route path="/login" element={<LoginPage/>}/>
    <Route path="/register" element={<RegisterPage/>}/>
    <Route path="/*" element={<Workspace/>}/>
  </Routes></BrowserRouter>
}
