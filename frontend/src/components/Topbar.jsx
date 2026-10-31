import { Bell, Search, ChevronDown } from 'lucide-react'

export default function Topbar({ title }) {
  return (
    <header className="topbar">
      <div className="breadcrumb">Workspace <span>/</span> <strong>{title}</strong></div>
      <div className="topbar-actions">
        <label className="search-box"><Search size={16} /><input aria-label="Search" placeholder="Search anything..." /></label>
        <button className="icon-button" aria-label="Notifications"><Bell size={18} /><i /></button>
        <div className="topbar-date">Saturday, October 31, 2026</div>
        <button className="profile-menu"><div className="avatar small">AD</div><ChevronDown size={15} /></button>
      </div>
    </header>
  )
}
