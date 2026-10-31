import { Construction, CheckCircle2, CircleDashed } from 'lucide-react'

const moduleInfo = {
  customers: { owner:'PERSON 1 · IDENTITY, ACCESS & CUSTOMER PORTAL', description:'Manage customer accounts, internal staff and role-based access.', features:['Customer signup with unique email and password policy','Admin, Internal Staff and Customer roles','Admin-only staff creation and customer data isolation','Customer portal: My Subscriptions and My Invoices'] },
  products: { owner:'PERSON 1 · CATALOG', description:'Maintain the product catalogue and configurable product variants.', features:['Product name, type, sales price and cost price','Product notes and variant options','Variant price adjustments (for example, brand-based pricing)'] },
  plans: { owner:'PERSON 1 · CATALOG', description:'Configure subscription plans, billing periods and lifecycle permissions.', features:['Price and daily, weekly, monthly or yearly billing period','Minimum quantity and available dates','Auto-close, closable, pausable and renewable flags'] },
  quotations: { owner:'PERSON 1 · QUOTATION TEMPLATES', description:'Create reusable quotation templates for the sales team.', features:['Select a plan and add product lines','Configure quotation validity in days','Templates are consumed by the subscription creation flow'] },
  subscriptions: { owner:'PERSON 2 · SUBSCRIPTIONS ENGINE', description:'Create and manage subscriptions from quotations through their full lifecycle.', features:['Auto-generated subscription number, customer, plan and dates','Payment terms and order lines with quantity, unit price, taxes and amount','Create subscriptions from quotation templates','Draft → Quotation → Confirmed → Active → Closed lifecycle with history'] },
  invoices: { owner:'PERSON 2 · INVOICING ENGINE', description:'Generate, review and manage recurring invoices.', features:['Billing-day job with idempotent invoice generation','Invoice lines, taxes and totals prefilled from subscriptions','Draft → Confirmed → Paid lifecycle, plus cancellation','Send invoices by email and print or export PDF','Admin-configured tax rules and automatic line calculations'] },
  settings: { owner:'SHARED WORKSPACE', description:'Shared project configuration and operational preferences.', features:['API connection and environment configuration','Shared account and workspace preferences','Role and access settings are owned by Person 1'] },
  'portal/my-subscriptions': { owner:'PERSON 1 · CUSTOMER PORTAL', description:'Customer-facing view of the signed-in customer’s own subscriptions.', features:['Show only the current customer’s subscriptions','Display plan, dates, payment terms and lifecycle status','Consume subscription data from Person 2 APIs'] },
  'portal/my-invoices': { owner:'PERSON 1 · CUSTOMER PORTAL', description:'Customer-facing invoice history for the signed-in customer.', features:['Show only the current customer’s invoices','Display invoice status, due date and outstanding amount','Consume invoice data from Person 2 APIs'] },
}

export default function Placeholder({ title, moduleKey }) {
  const info = moduleInfo[moduleKey] || { owner:'PROJECT MODULE', description:'This section is reserved for its assigned project owner.', features:[] }
  return <div className="page-content">
    <section className="page-heading"><div><div className="eyebrow">{info.owner}</div><h1>{title}</h1><p>{info.description}</p></div><span className="module-status"><CircleDashed size={13}/> Integration pending</span></section>
    <section className="panel module-panel">
      <div className="module-panel-head"><div className="placeholder-icon"><Construction size={22}/></div><div><h2>{title} module</h2><p>Dedicated section for the responsible team member. This page is intentionally separated from the other ownership areas.</p></div></div>
      <div className="module-feature-title">REQUIRED FUNCTIONALITY</div>
      <div className="module-feature-list">{info.features.map((feature, i) => <div className="module-feature" key={feature}><CheckCircle2 size={15}/><span>{feature}</span></div>)}</div>
      <div className="module-owner-note"><strong>Ownership boundary</strong><span>Keep this module’s UI, API integration and business logic in its assigned feature area. Shared navigation and visual components remain common across the application.</span></div>
    </section>
  </div>
}
