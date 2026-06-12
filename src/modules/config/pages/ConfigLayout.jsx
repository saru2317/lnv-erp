import React, { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import ModuleLayout from '@components/layout/ModuleLayout'
import PageLoader from '@components/ui/PageLoader'
import { useAuth } from '@context/AuthContext'

const ApprovalMatrixConfig = lazy(() => import('./ApprovalMatrixConfig'))
const AISettings           = lazy(() => import('./AISettings'))
const ConfigDashboard = lazy(() => import('./ConfigDashboard'))
const CompanyProfile  = lazy(() => import('./CompanyProfile'))
const BranchConfig    = lazy(() => import('./BranchConfig'))
const UserManagement  = lazy(() => import('./UserManagement'))
const RolesPermissions= lazy(() => import('./RolesPermissions'))
const NumberSeries    = lazy(() => import('./NumberSeries'))
const FiscalYear      = lazy(() => import('./FiscalYear'))
const TaxConfig       = lazy(() => import('./TaxConfig'))
const CurrencyConfig  = lazy(() => import('./CurrencyConfig'))
const EmailConfig     = lazy(() => import('./EmailConfig'))
const PrintTemplates  = lazy(() => import('./PrintTemplates'))
const SecurityConfig  = lazy(() => import('./SecurityConfig'))
const AuditLog        = lazy(() => import('./AuditLog'))
const LabourProcessConfig = lazy(() => import('./LabourProcessConfig'))

// Pages restricted to LNV Super Admin only
const SUPER_ADMIN_ONLY = [
  '/config/number-series',
  '/config/fiscal-year',
  '/config/email',
  '/config/security',
  '/config/audit',
]

// Locked route wrapper
function SuperAdminRoute({ children }) {
  const { isSuperAdmin } = useAuth()
  if (isSuperAdmin) return children
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center',
      justifyContent:'center', height:'60vh', gap:16 }}>
      <div style={{ fontSize:48 }}>🔒</div>
      <div style={{ fontSize:20, fontWeight:700, color:'#1C1C1C' }}>Super Admin Only</div>
      <div style={{ fontSize:13, color:'#6C757D', textAlign:'center', maxWidth:360 }}>
        This section is restricted to the <strong>LNV Super Administrator</strong>.<br/>
        Contact <code>admin@lnverp.com</code> for access.
      </div>
      <button onClick={()=>window.history.back()}
        style={{ marginTop:8, padding:'8px 20px', background:'#714B67', color:'#fff',
          border:'none', borderRadius:6, cursor:'pointer', fontSize:13, fontWeight:600 }}>
        ← Go Back
      </button>
    </div>
  )
}

export default function ConfigLayout() {
  const { isSuperAdmin } = useAuth()

  // Build sidebar — hide super-admin-only items from company admins
  const SIDEBAR_GROUPS = [
    { label:'Overview', items:[
      { to:'/config', label:'Config Dashboard' },
    ]},
    { label:'Company', items:[
      { to:'/config/company',  label:'🏢 Company Profile' },
      { to:'/config/branches', label:'🏭 Branches' },
    ]},
    { label:'Users & Access', items:[
      { to:'/config/users',    label:'👤 Users' },
      { to:'/config/roles',    label:'🔐 Roles & Permissions' },
      ...(isSuperAdmin ? [{ to:'/config/security', label:'🛡️ Sessions & Security' }] : []),
    ]},
    { label:'Accounting', items:[
      ...(isSuperAdmin ? [{ to:'/config/fiscal-year',   label:'📅 Fiscal Years' }] : []),
      ...(isSuperAdmin ? [{ to:'/config/number-series', label:'🔢 Number Series' }] : []),
      { to:'/config/tax',      label:'📊 Tax & GST' },
      { to:'/config/currency', label:'💱 Currency' },
    ]},
    { label:'System', items:[
      { to:'/config/print',            label:'🖨️ Print Templates' },
      { to:'/config/approval-matrix',  label:'✅ Approval Matrix' },
      { to:'/config/ai-settings',      label:'🤖 AI Assistant' },
      ...(isSuperAdmin ? [{ to:'/config/email', label:'📧 Email Settings' }] : []),
      ...(isSuperAdmin ? [{ to:'/config/audit', label:'📋 Audit Log' }] : []),
      ...(isSuperAdmin ? [{ to:'/config/labour-process', label:'⚙️ Labour Process Access' }] : []),
    ]},
  ]

  return (
    <ModuleLayout moduleName="Config" sidebarGroups={SIDEBAR_GROUPS}>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route index                  element={<ConfigDashboard />} />
          <Route path="company"         element={<CompanyProfile />} />
          <Route path="branches"        element={<BranchConfig />} />
          <Route path="users"           element={<UserManagement />} />
          <Route path="roles"           element={<RolesPermissions />} />
          <Route path="tax"             element={<TaxConfig />} />
          <Route path="currency"        element={<CurrencyConfig />} />
          <Route path="print"           element={<PrintTemplates />} />
          <Route path="approval-matrix" element={<ApprovalMatrixConfig />} />
          <Route path="ai-settings"     element={<AISettings />} />
          <Route path="approvals"       element={<Navigate to="/config/approval-matrix" replace />} />

          {/* Super Admin Only routes */}
          <Route path="security"      element={<SuperAdminRoute><SecurityConfig /></SuperAdminRoute>} />
          <Route path="fiscal-year"   element={<SuperAdminRoute><FiscalYear /></SuperAdminRoute>} />
          <Route path="number-series" element={<SuperAdminRoute><NumberSeries /></SuperAdminRoute>} />
          <Route path="email"         element={<SuperAdminRoute><EmailConfig /></SuperAdminRoute>} />
          <Route path="audit"          element={<SuperAdminRoute><AuditLog /></SuperAdminRoute>} />
          <Route path="labour-process" element={<SuperAdminRoute><LabourProcessConfig /></SuperAdminRoute>} />

          <Route path="*"             element={<Navigate to="/config" replace />} />
        </Routes>
      </Suspense>
    </ModuleLayout>
  )
}
