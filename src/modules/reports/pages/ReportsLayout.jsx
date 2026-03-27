import React, { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import ModuleLayout from '@components/layout/ModuleLayout'
import PageLoader from '@components/ui/PageLoader'

const ReportsDashboard  = lazy(() => import('./ReportsDashboard'))
const SalesReport       = lazy(() => import('./SalesReport'))
const PurchaseReport    = lazy(() => import('./PurchaseReport'))
const InventoryReport   = lazy(() => import('./InventoryReport'))
const ProductionReport  = lazy(() => import('./ProductionReport'))
const FinanceReport     = lazy(() => import('./FinanceReport'))
const HRReport          = lazy(() => import('./HRReport'))
const QualityReport     = lazy(() => import('./QualityReport'))
const TransportReport   = lazy(() => import('./TransportReport'))
const InventoryWMReport = lazy(() => import('./InventoryWMReport'))
const AssetReport       = lazy(() => import('./AssetReport'))
const CRMReport         = lazy(() => import('./CRMReport'))

const NAV_ITEMS = [
  { to:'/reports',            label:' Overview' },
  { to:'/reports/sales',      label:' Sales' },
  { to:'/reports/purchase',   label:' Purchase' },
  { to:'/reports/inventory',  label:' Inventory' },
  { to:'/reports/production', label:' Production' },
  { to:'/reports/finance',    label:' Finance' },
]

const SIDEBAR_GROUPS = [
  { label:'Business Reports', icon:'📦', items:[
    { to:'/reports',           label:' Executive Dashboard' },
    { to:'/reports/sales',     label:' Sales & Revenue' },
    { to:'/reports/purchase',  label:' Purchase & Vendors' },
    { to:'/reports/inventory', label:' Inventory & Stock' },
    { to:'/reports/production',label:' Production & Jobs' },
  ]},
  { label:'Financial Reports', icon:'📦', items:[
    { to:'/reports/finance',   label:' Finance Summary' },
    { to:'/fi/pl',             label:'P&L Statement →' },
    { to:'/fi/bs',             label:'Balance Sheet →' },
    { to:'/fi/cashflow',       label:'Cash Flow →' },
    { to:'/fi/itc-recon',      label:'ITC Reconciliation →' },
  ]},
  { label:'HR & Operations', icon:'👥', items:[
    { to:'/reports/hr',        label:' HR Report' },
    { to:'/reports/quality',   label:' Quality Report' },
    { to:'/reports/transport', label:' Transport Report' },
    { to:'/reports/inventory', label:' Inventory (WM)' },
    { to:'/reports/assets',    label:' Asset Report' },
    { to:'/reports/crm',       label:' CRM Report' },
  ]},
]

export default function ReportsLayout() {
  return (
    <ModuleLayout moduleName="Reports" navItems={NAV_ITEMS} sidebarGroups={SIDEBAR_GROUPS}>
      <Suspense fallback={<PageLoader text="Loading report…" />}>
        <Routes>
          <Route index                element={<ReportsDashboard />} />
          <Route path="sales"         element={<SalesReport />} />
          <Route path="purchase"      element={<PurchaseReport />} />
          <Route path="inventory"     element={<InventoryReport />} />
          <Route path="production"    element={<ProductionReport />} />
          <Route path="finance"       element={<FinanceReport />} />
          <Route path="hr"            element={<HRReport />} />
          <Route path="quality"       element={<QualityReport />} />
          <Route path="transport"     element={<TransportReport />} />
          <Route path="inventory"     element={<InventoryWMReport />} />
          <Route path="assets"        element={<AssetReport />} />
          <Route path="crm"           element={<CRMReport />} />
          <Route path="*"             element={<Navigate to="/reports" replace />} />
        </Routes>
      </Suspense>
    </ModuleLayout>
  )
}
