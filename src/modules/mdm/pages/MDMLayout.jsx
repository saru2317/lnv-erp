import React, { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import ModuleLayout from '@components/layout/ModuleLayout'
import PageLoader from '@components/ui/PageLoader'


const MDMDashboard = lazy(() => import('./MDMDashboard'))
const ItemMaster = lazy(() => import('./ItemMaster'))
const BOMList = lazy(() => import('./BOMList'))
const RoutingMaster = lazy(() => import('./RoutingMaster'))
const CustomerMaster = lazy(() => import('./CustomerMaster'))
const VendorMaster = lazy(() => import('./VendorMaster'))
const ChartOfAccounts = lazy(() => import('./ChartOfAccounts'))
const CostCenters = lazy(() => import('./CostCenters'))
const UOMMaster = lazy(() => import('./UOMMaster'))
const HSNMaster = lazy(() => import('./HSNMaster'))
const WarehouseMaster = lazy(() => import('./WarehouseMaster'))
const QualityMaster = lazy(() => import('./QualityMaster'))
const MaintenanceMaster = lazy(() => import('./MaintenanceMaster'))
const HRMaster = lazy(() => import('./HRMaster'))
const HRPolicyMaster = lazy(() => import('./HRPolicyMaster'))
const PayComponentMaster = lazy(() => import('./PayComponentMaster'))
const StatutoryConfig = lazy(() => import('./StatutoryConfig'))
const IncrementPolicy = lazy(() => import('./IncrementPolicy'))
const PerformanceRating = lazy(() => import('./PerformanceRating'))
const IncrementProposals = lazy(() => import('./IncrementProposals'))
const MDApprovalDashboard = lazy(() => import('./MDApprovalDashboard'))

// ── New Masters ──────────────────────────────────────
const ItemGroupMaster = lazy(() => import('./ItemGroupMaster'))
const ItemTypeMaster = lazy(() => import('./ItemTypeMaster'))
const MaterialTypeMaster = lazy(() => import('./MaterialTypeMaster'))
const SupplierTypeMaster = lazy(() => import('./SupplierTypeMaster'))
const ProcessMaster = lazy(() => import('./ProcessMaster'))

const NAV = [
  { to: '/mdm', label: 'Dashboard' },
  { to: '/mdm/items', label: 'Items' },
  { to: '/mdm/customers', label: 'Customers' },
  { to: '/mdm/vendors', label: 'Vendors' },
  { to: '/mdm/accounts', label: 'Accounts' },
]

const SIDEBAR = [
  {
    label: 'Overview', icon: '🗄️', items: [
      { to: '/mdm', label: 'MDM Dashboard' },
    ]
  },
  {
    label: 'Item Masters', icon: '📋', items: [
      { to: '/mdm/items', label: 'Item Master (MM60)' },
      { to: '/mdm/item-group', label: 'Item Group' },
      { to: '/mdm/item-type', label: 'Item Type' },
      { to: '/mdm/material-type', label: 'Material Type' },
      { to: '/mdm/uom', label: 'Unit of Measure' },
      { to: '/mdm/hsn', label: 'HSN / SAC Codes' },
      { to: '/mdm/bom', label: 'Bill of Materials' },
      { to: '/mdm/routing', label: 'Routing / Process' },
      { to: '/mdm/process', label: 'Process Master' },
        ]
  },
  {
    label: 'Business Partners', icon: '🤝', items: [
      { to: '/mdm/customers', label: 'Customer Master' },
      { to: '/mdm/vendors', label: 'Vendor Master' },
      { to: '/mdm/supplier-type', label: 'Supplier Type' },
    ]
  },
  {
    label: 'Finance Masters', icon: '💰', items: [
      { to: '/mdm/accounts', label: 'Chart of Accounts' },
      { to: '/mdm/cost-centers', label: 'Cost Centers' },
    ]
  },
  {
    label: 'Operations', icon: '⚙️', items: [
      { to: '/mdm/warehouse', label: 'Warehouse / Locations' },
      { to: '/mdm/quality', label: 'Quality Masters' },
      { to: '/mdm/maintenance', label: 'Maintenance Masters' },
      { to: '/mdm/hr', label: 'HR Masters' },
      { to: '/mdm/hr-policy', label: 'HR Policy Engine' },
      { to: '/mdm/pay-component', label: 'Pay Components' },
      { to:'/mdm/increment', label:'📈 Increment Policy' },
      { to:'/mdm/increment-proposals', label:'📊 Increment Proposals' },
      { to:'/mdm/md-approval', label:'👔 MD Approval' },
      { to:'/mdm/statutory', label:'⚙️ Statutory Config' },
      { to:'/mdm/performance-rating', label:'⭐ Performance Rating' },
    ]
  },
]

export default function MDMLayout() {
  return (
    <ModuleLayout navItems={NAV} sidebarGroups={SIDEBAR}>
      <Suspense fallback={<PageLoader text="Loading MDM..." />}>
        <Routes>
          <Route index element={<MDMDashboard />} />
          <Route path="items" element={<ItemMaster />} />
          <Route path="item-group" element={<ItemGroupMaster />} />
          <Route path="item-type" element={<ItemTypeMaster />} />
          <Route path="material-type" element={<MaterialTypeMaster />} />
          <Route path="supplier-type" element={<SupplierTypeMaster />} />
          <Route path="uom" element={<UOMMaster />} />
          <Route path="hsn" element={<HSNMaster />} />
          <Route path="bom" element={<BOMList />} />
          <Route path="routing" element={<RoutingMaster />} />
          <Route path="process" element={<ProcessMaster />} />
          <Route path="customers" element={<CustomerMaster />} />
          <Route path="vendors" element={<VendorMaster />} />
          <Route path="accounts" element={<ChartOfAccounts />} />
          <Route path="cost-centers" element={<CostCenters />} />
          <Route path="warehouse" element={<WarehouseMaster />} />
          <Route path="quality" element={<QualityMaster />} />
          <Route path="maintenance" element={<MaintenanceMaster />} />
          <Route path="hr" element={<HRMaster />} />
          <Route path="hr-policy" element={<HRPolicyMaster />} />
          <Route path="pay-component" element={<PayComponentMaster />} />
          <Route path="*" element={<Navigate to="/mdm" replace />} />
          <Route path="statutory" element={<StatutoryConfig />} />
          <Route path="increment" element={<IncrementPolicy />} />
          <Route path="performance-rating" element={<PerformanceRating />} />
          <Route path="increment-proposals" element={<IncrementProposals />} />
          <Route path="md-approval" element={<MDApprovalDashboard />} />
        </Routes>
      </Suspense>
    </ModuleLayout>
  )
}
