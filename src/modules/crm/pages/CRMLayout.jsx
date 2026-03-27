import React, { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import ModuleLayout from '@components/layout/ModuleLayout'
import PageLoader from '@components/ui/PageLoader'

const CRMDashboard      = lazy(() => import('./CRMDashboard'))
const LeadList          = lazy(() => import('./LeadList'))
const LeadNew           = lazy(() => import('./LeadNew'))
const LeadView          = lazy(() => import('./LeadView'))
const OpportunityList   = lazy(() => import('./OpportunityList'))
const OpportunityNew    = lazy(() => import('./OpportunityNew'))
const OpportunityView   = lazy(() => import('./OpportunityView'))
const ActivityLog       = lazy(() => import('./ActivityLog'))
const QuotationList     = lazy(() => import('./QuotationList'))
const QuotationNew      = lazy(() => import('./QuotationNew'))
const QuotationView     = lazy(() => import('./QuotationView'))
const CustomerMaster    = lazy(() => import('./CustomerMaster'))
const CustomerView      = lazy(() => import('./CustomerView'))
const ContactManagement = lazy(() => import('./ContactManagement'))
const ComplaintTicket   = lazy(() => import('./ComplaintTicket'))
const SalesTarget       = lazy(() => import('./SalesTarget'))
const LostAnalysis      = lazy(() => import('./LostAnalysis'))
const CRMReports        = lazy(() => import('./CRMReports'))

const SIDEBAR_GROUPS = [
  { label:'Overview', icon:'▸', items:[
    { to:'/crm',                   label:'CRM Dashboard' },
  ]},
  { label:'Lead Management', icon:'▸', items:[
    { to:'/crm/leads',             label:'Lead List' },
    { to:'/crm/leads/new',         label:'New Lead' },
  ]},
  { label:'Opportunities', icon:'📦', items:[
    { to:'/crm/opportunities',     label:'Opportunity Pipeline' },
    { to:'/crm/opportunities/new', label:'New Opportunity' },
  ]},
  { label:'Activities', icon:'▸', items:[
    { to:'/crm/activities',        label:'Activity Log' },
  ]},
  { label:'Quotations', icon:'▸', items:[
    { to:'/crm/quotations',        label:'Quotation List' },
    { to:'/crm/quotations/new',    label:'New Quotation' },
  ]},
  { label:'Customers', icon:'👥', items:[
    { to:'/crm/customers',         label:'Customer Master' },
    { to:'/crm/contacts',          label:'Contacts' },
    { to:'/crm/complaints',        label:'Complaints / Tickets' },
  ]},
  { label:'Performance', icon:'▸', items:[
    { to:'/crm/targets',           label:'Sales Targets' },
    { to:'/crm/lost-analysis',     label:'Lost Analysis' },
  ]},
  { label:'Reports', icon:'📦', items:[
    { to:'/crm/reports',           label:'CRM Reports' },
  ]},
]

export default function CRMLayout() {
  return (
    <ModuleLayout moduleName="CRM" sidebarGroups={SIDEBAR_GROUPS}>
      <Suspense fallback={<PageLoader text="Loading CRM…" />}>
        <Routes>
          <Route index                        element={<CRMDashboard />} />
          <Route path="leads"                 element={<LeadList />} />
          <Route path="leads/new"             element={<LeadNew />} />
          <Route path="leads/:id"             element={<LeadView />} />
          <Route path="opportunities"         element={<OpportunityList />} />
          <Route path="opportunities/new"     element={<OpportunityNew />} />
          <Route path="opportunities/:id"     element={<OpportunityView />} />
          <Route path="activities"            element={<ActivityLog />} />
          <Route path="quotations"            element={<QuotationList />} />
          <Route path="quotations/new"        element={<QuotationNew />} />
          <Route path="quotations/:id"        element={<QuotationView />} />
          <Route path="customers"             element={<CustomerMaster />} />
          <Route path="customers/:id"         element={<CustomerView />} />
          <Route path="contacts"             element={<ContactManagement />} />
          <Route path="complaints"            element={<ComplaintTicket />} />
          <Route path="targets"              element={<SalesTarget />} />
          <Route path="lost-analysis"        element={<LostAnalysis />} />
          <Route path="reports"              element={<CRMReports />} />
          <Route path="*"                    element={<Navigate to="/crm" replace />} />
        </Routes>
      </Suspense>
    </ModuleLayout>
  )
}
