/**
 * MM Module Layout + Router
 * All /mm/* routes are handled here
 */
import React, { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import ModuleLayout from '@components/layout/ModuleLayout'
import PageLoader from '@components/ui/PageLoader'

// ── Lazy-load each MM page ────────────────────────────
const MMDashboard   = lazy(() => import('./MMDashboard'))
const POList        = lazy(() => import('./POList'))
const PONew         = lazy(() => import('./PONew'))
const POView        = lazy(() => import('./POView'))
const POPrint       = lazy(() => import('@components/print/POPrint'))   // FIX: correct path
const VendorInvList = lazy(() => import('./VendorInvList'))
const VendorInvNew  = lazy(() => import('./VendorInvNew'))
const VendorList    = lazy(() => import('./VendorList'))
const VendorNew     = lazy(() => import('./VendorNew'))
const VendorLedger  = lazy(() => import('./VendorLedger'))
const PaymentList   = lazy(() => import('./PaymentList'))
const RFQList       = lazy(() => import('./RFQList'))
const PendingPO     = lazy(() => import('./PendingPO'))
const MaterialList  = lazy(() => import('./MaterialList'))
const POReport      = lazy(() => import('./POReport'))
const PRList        = lazy(() => import('./PRList'))
const PRNew         = lazy(() => import('./PRNew'))
const CSList        = lazy(() => import('./CSList'))
const CSNew         = lazy(() => import('./CSNew'))
const GRNList       = lazy(() => import('./GRNList'))
const GRNNew              = lazy(() => import('./GRNNew'))
const VendorPaymentRequest = lazy(() => import('./VendorPaymentRequest'))
const VendorRateCardMaster = lazy(() => import('./VendorRateCardMaster'))
const SubcontractList      = lazy(() => import('./SubcontractList'))
const Subcontracting       = lazy(() => import('./Subcontracting'))
const MMApprovals   = lazy(() => import('@components/ui/MyApprovals'))

const NAV_ITEMS = [
  { to: '/mm',           label: ' Home',            icon: '' },
  { to: '/mm/pr',        label: ' Purchase Indent', icon: '' },
  { to: '/mm/cs',        label: ' Comparative',     icon: '' },
  { to: '/mm/po',        label: ' Purchase Orders', icon: '' },
  { to: '/mm/grn',       label: ' GRN',             icon: '' },
  { to: '/mm/invoices',  label: ' Vendor Invoice',  icon: '' },
  { to: '/mm/vendors',   label: ' Vendors',         icon: '' },
  { to: '/mm/payments',  label: ' Payments',        icon: '' },
  { to: '/mm/report',    label: ' Reports',         icon: '' },
]

const SIDEBAR_GROUPS = [
  {
    label: 'Purchase Indent & CS', icon: '',
    items: [
      { to: '/mm/pr',         label: 'PR List (Purchase Indent)' },
      { to: '/mm/pr/new',     label: 'New Purchase Indent' },
      { to: '/mm/cs',         label: 'CS Register' },
      { to: '/mm/cs/new',     label: 'New Comparative Statement' },
    ]
  },
  {
    label: 'Purchase Orders', icon: '',
    items: [
      { to: '/mm/po',           label: 'PO List (ME2M)' },
      { to: '/mm/po/new',       label: 'Create PO (ME21N)' },
      { to: '/mm/rfq',          label: 'RFQ / Enquiries (ME41)' },
      { to: '/mm/po/pending',   label: 'Pending POs' },
    ]
  },
  {
    label: 'Subcontracting', icon: '',
    items: [
      { to: '/mm/subcontract',     label: 'Outstanding at Vendor' },
      { to: '/mm/subcontract/new', label: 'Send Out / Return' },
      { to: '/mm/vendor-rate-card', label: 'Vendor Rate Card' },
    ]
  },
  {
    label: 'Goods Receipt (GRN)', icon: '',
    items: [
      { to: '/mm/grn',       label: 'GRN List (MB51)' },
      { to: '/mm/grn/new',   label: 'Record GRN (MIGO)' },
    ]
  },
  {
    label: 'Vendor Invoice', icon: '',
    items: [
      { to: '/mm/invoices',     label: 'Invoice List (MIRO)' },
      { to: '/mm/invoices/new', label: 'Enter Invoice' },
      { to: '/mm/payment-requests', label: '📋 Payment Requests' },
      { to: '/mm/payments',         label: 'Vendor Payments' },
      { to: '/mm/vendors/ledger', label: 'Vendor Ledger' },
    ]
  },
  {
    label: 'Vendor Master', icon: '',
    items: [
      { to: '/mm/vendors',      label: 'Vendor List (MK03)' },
      { to: '/mm/vendors/new',  label: 'New Vendor' },
      { to: '/mm/materials',    label: 'Material Master' },
      { to: '/mm/vendor-rate-card', label: 'Vendor Rate Card (Subcontract)' },
    ]
  },
  {
    label: 'Reports', icon: '',
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
          <Route index              element={<MMDashboard />} />

          {/* PR */}
          <Route path="pr"          element={<PRList />} />
          <Route path="pr/new"      element={<PRNew />} />

          {/* CS */}
          <Route path="cs"          element={<CSList />} />
          <Route path="cs/new"      element={<CSNew />} />
          <Route path="cs/:id"      element={<CSNew />} />

          {/* PO */}
          <Route path="po"          element={<POList />} />
          <Route path="po/new"      element={<PONew />} />
          <Route path="po/pending"  element={<PendingPO />} />
          <Route path="po/edit/:id" element={<PONew />} />
          <Route path="po/:id/print" element={<POPrint />} />
          <Route path="po/:id"      element={<POView />} />

          {/* GRN */}
          <Route path="grn"         element={<GRNList />} />
          <Route path="grn/new"     element={<GRNNew />} />

          {/* Vendor Invoice */}
          <Route path="invoices"    element={<VendorInvList />} />
          <Route path="approvals"   element={<MMApprovals module="MM" />} />
          <Route path="invoices/new" element={<VendorInvNew />} />

          {/* Vendors */}
          <Route path="vendors"     element={<VendorList />} />
          <Route path="vendors/new" element={<VendorNew />} />
          <Route path="vendors/ledger" element={<VendorLedger />} />
          <Route path="vendor-rate-card" element={<VendorRateCardMaster />} />
          <Route path="subcontract"     element={<SubcontractList />} />
          <Route path="subcontract/new" element={<Subcontracting />} />

          {/* Others */}
          <Route path="payments"           element={<PaymentList />} />
          <Route path="payment-requests"  element={<VendorPaymentRequest />} />
          <Route path="rfq"         element={<RFQList />} />
          <Route path="materials"   element={<MaterialList />} />
          <Route path="report"      element={<POReport />} />

          <Route path="*"           element={<Navigate to="/mm" replace />} />
        </Routes>
      </Suspense>
    </ModuleLayout>
  )
}
