import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import Dashboard from './pages/Dashboard'
import Placeholder from './pages/Placeholder'
import { DiscountsPage, PaymentsPage, FinanceDashboardPage } from './features/finance/FinancePages'

const pages = [
  ['customers', 'Customers & Access'], ['products', 'Products & Variants'], ['plans', 'Plans'],
  ['quotations', 'Quotation Templates'], ['subscriptions', 'Subscriptions'], ['invoices', 'Invoices'],
  ['payments', 'Payments'], ['discounts', 'Discount Rules'], ['reports', 'Finance Reports'], ['settings', 'Settings'],
  ['portal/my-subscriptions', 'My Subscriptions'], ['portal/my-invoices', 'My Invoices'],
]

function ApplicationShell() {
  const location = useLocation()
  const current = pages.find(([path]) => `/${path}` === location.pathname)
  const title = location.pathname === '/' ? 'Overview' : current?.[1] || 'Overview'
  return <div className="app-shell"><Sidebar/><main className="main-area"><Topbar title={title}/><Routes>
    <Route path="/" element={<Dashboard/>}/>
    <Route path="/discounts" element={<DiscountsPage/>}/>
    <Route path="/payments" element={<PaymentsPage/>}/>
    <Route path="/reports" element={<FinanceDashboardPage/>}/>
    {pages.filter(([path]) => !['discounts','payments','reports'].includes(path)).map(([path,label]) => <Route key={path} path={`/${path}`} element={<Placeholder title={label} moduleKey={path}/>}/>)}
    <Route path="*" element={<Navigate to="/" replace/>}/>
  </Routes></main></div>
}
export default function App(){ return <BrowserRouter><ApplicationShell/></BrowserRouter> }
