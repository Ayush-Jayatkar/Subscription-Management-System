import { Construction } from 'lucide-react'

export default function Placeholder({ title }) {
  return (
    <div className="page-content">
      <section className="page-heading"><div><div className="eyebrow">BRIGHTLOOP WORKSPACE</div><h1>{title}</h1><p>This module is part of the project roadmap.</p></div></section>
      <section className="panel placeholder-panel"><div className="placeholder-icon"><Construction size={23} /></div><h2>{title} module is ready to be built</h2><p>This is a placeholder page. The assigned team member can implement the UI, API endpoints, database models and tests here.</p></section>
    </div>
  )
}
