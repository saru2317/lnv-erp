/**
 * MM Module Layout + Router
 * All /mm/* routes are handled here
 */
import React, { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import ModuleLayout from '@components/layout/ModuleLayout'
import PageLoader from '@components/ui/PageLoader'

// Lazy-load each MM page
const MMDashboard    = lazy(() => import('./MMDashboard'))
const POList         = lazy(() => import('./POList'))
const PONew          = lazy(() => import('./PONew'))
const POView         = lazy(() => import('./POView'))
const GRNList        = lazy(() => import('./GRNList'))
const GRNNew         = lazy(() => import('./GRNNew'))
const VendorInvList  = lazy(() => import('./VendorInvList'))
const VendorInvNew   = lazy(() => import('./VendorInvNew'))
const VendorList     = lazy(() => import('./VendorList'))
const VendorNew      = lazy(() => import('./VendorNew'))
const VendorLedger   = lazy(() => import('./VendorLedger'))
const PaymentList    = lazy(() => import('./PaymentList'))
const RFQList        = lazy(() => import('./RFQList'))
const PendingPO      = lazy(() => import('./PendingPO'))
const MaterialList   = lazy(() => import('./MaterialList'))
const POReport       = lazy(() => import('./POReport'))
const ReturnList     = lazy(() => import('./ReturnList'))
const PRList         = lazy(() => import('./PRList'))
const PRNew          = lazy(() => import('./PRNew'))
const CSList         = lazy(() => import('./CSList'))
const CSNew          = lazy(() => import('./CSNew'))

const NAV_ITEMS = [
  { to: '/mm',             label: '🏠 Home',             icon: '' },
  { to: '/mm/po',          label: '📋 Purchase Orders',   icon: '' },
  { to: '/mm/grn',         label: '📦 GRN / Receipt',     icon: '' },
  { to: '/mm/invoices',    label: '🧾 Vendor Invoice',    icon: '' },
  { to: '/mm/vendors',     label: '🏭 Vendors',           icon: '' },
  { to: '/mm/payments',    label: '💳 Payments',          icon: '' },
  { to: '/mm/report',      label: '📊 Reports',           icon: '' },
  { to: '/mm/pr',          label: '📝 Purchase Indent',  icon: '' },
  { to: '/mm/cs',          label: '📊 Comparative',      icon: '' },
]

const SIDEBAR_GROUPS = [
  {
    label: 'Purchase Orders', icon: '📋',
    items: [
      { to: '/mm/po',           label: 'PO List (ME2M)' },
      { to: '/mm/po/new',       label: 'Create PO (ME21N)' },
      { to: '/mm/rfq',          label: 'RFQ / Enquiries (ME41)' },
      { to: '/mm/po/pending',   label: 'Pending POs' },
    ]
  },
  {
    label: 'Goods Receipt', icon: '📦',
    items: [
      { to: '/mm/grn',          label: 'GRN List (MB51)' },
      { to: '/mm/grn/new',      label: 'Record GRN (MIGO)' },
      { to: '/mm/returns',      label: 'Purchase Returns' },
    ]
  },
  {
    label: 'Vendor Invoice', icon: '🧾',
    items: [
      { to: '/mm/invoices',     label: 'Invoice List (MIRO)' },
      { to: '/mm/invoices/new', label: 'Enter Invoice' },
      { to: '/mm/payments',     label: 'Vendor Payments' },
      { to: '/mm/vendors/ledger', label: 'Vendor Ledger' },
    ]
  },
  {
    label: 'Vendor Master', icon: '🏭',
    items: [
      { to: '/mm/vendors',      label: 'Vendor List (MK03)' },
      { to: '/mm/vendors/new',  label: 'New Vendor' },
      { to: '/mm/materials',    label: 'Material Master' },
    ]
  },
  {
    label: 'Purchase Indent & CS', icon: '📊',
    items: [
      { to: '/mm/pr',           label: 'PR List (Purchase Indent)' },
      { to: '/mm/pr/new',       label: 'New Purchase Indent' },
      { to: '/mm/cs',           label: 'CS Register' },
      { to: '/mm/cs/new',       label: 'New Comparative Statement' },
    ]
  },
  {
    label: 'Reports', icon: '📊',
    items: [
      { to: '/mm/report',       label: 'Purchase Register' },
      { to: '/mm/po/pending',   label: 'Pending POs' },
    ]
  },
]

export default function MMLayout() {
  return (
    <ModuleLayout moduleName="MM" navItems={NAV_ITEMS} sidebarGroups={SIDEBAR_GROUPS}>
      <Suspense fallback={<PageLoader text="Loading MM page…" />}>
        <Routes>
          <Route index            element={<MMDashboard />} />
          <Route path="po"        element={<POList />} />
          <Route path="po/new"    element={<PONew />} />
          <Route path="po/pending"element={<PendingPO />} />
          <Route path="po/:id"    element={<POView />} />
          <Route path="grn"       element={<GRNList />} />
          <Route path="grn/new"   element={<GRNNew />} />
          <Route path="invoices"  element={<VendorInvList />} />
          <Route path="invoices/new" element={<VendorInvNew />} />
          <Route path="vendors"   element={<VendorList />} />
          <Route path="vendors/new" element={<VendorNew />} />
          <Route path="vendors/ledger" element={<VendorLedger />} />
          <Route path="payments"  element={<PaymentList />} />
          <Route path="rfq"       element={<RFQList />} />
          <Route path="materials" element={<MaterialList />} />
          <Route path="report"    element={<POReport />} />
          <Route path="returns"   element={<ReturnList />} />
          <Route path="pr"          element={<PRList />} />
          <Route path="pr/new"      element={<PRNew />} />
          <Route path="cs"          element={<CSList />} />
          <Route path="cs/new"      element={<CSNew />} />
          <Route path="*"         element={<Navigate to="/mm" replace />} />
        </Routes>
      </Suspense>
    </ModuleLayout>
  )
}
