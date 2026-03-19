import React, { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import ModuleLayout from '@components/layout/ModuleLayout'
import PageLoader from '@components/ui/PageLoader'

const ListScreenSettings = lazy(() => import('./ListScreenSettings'))
const ApprovalInbox = lazy(() => import('./ApprovalInbox'))
const AuditDashboard = lazy(() => import('./AuditDashboard'))
const AuditLog       = lazy(() => import('./AuditLog'))
const AuditByModule  = lazy(() => import('./AuditByModule'))
const AuditByUser    = lazy(() => import('./AuditByUser'))
const UserManagement = lazy(() => import('./UserManagement'))

const SIDEBAR_GROUPS = [
  { label:'Audit Trail', icon:'📋', items:[
    {to:'/admin',                label:'Audit Dashboard'},
    {to:'/admin/audit/logs',     label:'Full Audit Log'},
    {to:'/admin/audit/module',   label:'Audit by Module'},
    {to:'/admin/audit/user',     label:'Audit by User'},
  ]},
  { label:'Administration', icon:'⚙️', items:[
    {to:'/admin/users',          label:'User Management'},
    {to:'/admin/approvals',      label:'Approval Inbox'},
    {to:'/admin/list-settings',  label:'List Screen Settings'},
  ]},
]

export default function AdminLayout() {
  return (
    <ModuleLayout moduleName="ADMIN" sidebarGroups={SIDEBAR_GROUPS}>
      <Suspense fallback={<PageLoader text="Loading Admin page…"/>}>
        <Routes>
          <Route path="list-settings" element={<ListScreenSettings />} />
          <Route path="approvals" element={<ApprovalInbox />} />
          <Route index                    element={<AuditDashboard />} />
          <Route path="audit/logs"        element={<AuditLog />} />
          <Route path="audit/module"      element={<AuditByModule />} />
          <Route path="audit/user"        element={<AuditByUser />} />
          <Route path="users"             element={<UserManagement />} />
          <Route path="*"                 element={<Navigate to="/admin" replace />} />
        </Routes>
      </Suspense>
    </ModuleLayout>
  )
}
