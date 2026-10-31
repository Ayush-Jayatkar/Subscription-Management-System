import { Bell, Search } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'

export default function Topbar({ title }) {
  const { user } = useAuth()
  return (
    <header className="topbar">
      <div className="breadcrumb">Workspace <span>/</span> <strong>{title}</strong></div>
      <div className="topbar-actions">
        <label className="search-box"><Search size={16} /><input aria-label="Search" placeholder="Search anything..." /></label>
        <div className="topbar-user">{user?.full_name} <span>{user?.role?.replace('_',' ')}</span></div>
      </div>
    </header>
  )
}
