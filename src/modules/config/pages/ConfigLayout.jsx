import React, { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import ModuleLayout from '@components/layout/ModuleLayout'
import PageLoader from '@components/ui/PageLoader'

const ConfigDashboard = lazy(() => import('./ConfigDashboard'))
const CompanyProfile  = lazy(() => import('./CompanyProfile'))
const BranchConfig    = lazy(() => import('./BranchConfig'))
const UserManagement  = lazy(() => import('./UserManagement'))
const RolesPermissions= lazy(() => import('./RolesPermissions'))
const NumberSeries    = lazy(() => import('./NumberSeries'))
const FiscalYear      = lazy(() => import('./FiscalYear'))
const ApprovalConfig    = lazy(() => import('./ApprovalConfig'))
const TaxConfig       = lazy(() => import('./TaxConfig'))
const CurrencyConfig  = lazy(() => import('./CurrencyConfig'))
const EmailConfig     = lazy(() => import('./EmailConfig'))
const PrintTemplates  = lazy(() => import('./PrintTemplates'))
const SecurityConfig  = lazy(() => import('./SecurityConfig'))
const AuditLog        = lazy(() => import('./AuditLog'))

const SIDEBAR_GROUPS = [
  { label:'Overview', icon:'', items:[
    { to:'/config',              label:'Config Dashboard' },
  ]},
  { label:'Company', icon:'', items:[
    { to:'/config/company',      label:'Company Profile' },
    { to:'/config/branches',     label:'Branches' },
  ]},
  { label:'Users & Access', icon:'', items:[
    { to:'/config/users',        label:'Users' },
    { to:'/config/roles',        label:'Roles & Permissions' },
    { to:'/config/security',     label:'Sessions & Security' },
  ]},
  { label:'Accounting', icon:'', items:[
    { to:'/config/fiscal-year',  label:'Fiscal Years' },
    { to:'/config/number-series',label:'Number Series' },
    { to:'/config/tax',          label:'Tax & GST' },
    { to:'/config/currency',     label:'Currency' },
  ]},
  { label:'System', icon:'', items:[
    { to:'/config/email',        label:'Email Settings' },
    { to:'/config/print',        label:'Print Templates' },
    { to:'/config/audit',        label:'Audit Log' },
    { to:'/config/approvals',    label:'Approval Workflows' },
  ]},
]

export default function ConfigLayout() {
  return (
    <ModuleLayout moduleName="Config" sidebarGroups={SIDEBAR_GROUPS}>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route index                  element={<ConfigDashboard />} />
          <Route path="company"         element={<CompanyProfile />} />
          <Route path="branches"        element={<BranchConfig />} />
          <Route path="users"           element={<UserManagement />} />
          <Route path="roles"           element={<RolesPermissions />} />
          <Route path="security"        element={<SecurityConfig />} />
          <Route path="fiscal-year"     element={<FiscalYear />} />
          <Route path="number-series"   element={<NumberSeries />} />
          <Route path="approvals" element={<ApprovalConfig />} />
          <Route path="tax"             element={<TaxConfig />} />
          <Route path="currency"        element={<CurrencyConfig />} />
          <Route path="email"           element={<EmailConfig />} />
          <Route path="print"           element={<PrintTemplates />} />
          <Route path="audit"           element={<AuditLog />} />
          <Route path="*"               element={<Navigate to="/config" replace />} />
        </Routes>
      </Suspense>
    </ModuleLayout>
  )
}
