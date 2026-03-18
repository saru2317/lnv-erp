import React, { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import ModuleLayout from '@components/layout/ModuleLayout'
import PageLoader from '@components/ui/PageLoader'

const WMDashboard      = lazy(() => import('./WMDashboard'))
const StockList        = lazy(() => import('./StockList'))
const BinStock         = lazy(() => import('./BinStock'))
const ReorderList      = lazy(() => import('./ReorderList'))
const GoodsReceipt     = lazy(() => import('./GoodsReceipt'))
const GoodsIssue       = lazy(() => import('./GoodsIssue'))
const StockTransfer    = lazy(() => import('./StockTransfer'))
const MovementLog      = lazy(() => import('./MovementLog'))
const PhysicalInventory= lazy(() => import('./PhysicalInventory'))
const StockAdjustment  = lazy(() => import('./StockAdjustment'))
const ExpiryTracking   = lazy(() => import('./ExpiryTracking'))
const WHMap            = lazy(() => import('./WHMap'))
const BinMaster        = lazy(() => import('./BinMaster'))
const StockReport      = lazy(() => import('./StockReport'))

const NAV_ITEMS = [
  { to: '/wm',             label: '🏠 Home' },
  { to: '/wm/stock',       label: '📦 Stock' },
  { to: '/wm/goods-issue', label: '📤 Goods Issue' },
  { to: '/wm/transfer',    label: '🔄 Transfer' },
  { to: '/wm/report',      label: '📊 Reports' },
]

const SIDEBAR_GROUPS = [
  {
    label: 'Stock Overview', icon: '📦',
    items: [
      { to: '/wm/stock',         label: 'Stock Overview (MB52)' },
      { to: '/wm/bin-stock',     label: 'Bin / Location Stock' },
      { to: '/wm/reorder',       label: 'Reorder Alerts ⚠️' },
      { to: '/wm/expiry',        label: 'Expiry Tracking' },
    ]
  },
  {
    label: 'Stock Movements', icon: '📤',
    items: [
      { to: '/wm/goods-receipt', label: 'Goods Receipt (GR)' },
      { to: '/wm/goods-issue',   label: 'Goods Issue (GI)' },
      { to: '/wm/transfer',      label: 'Stock Transfer (MB1B)' },
      { to: '/wm/movement-log',  label: 'Movement Log (MB51)' },
    ]
  },
  {
    label: 'Physical Inventory', icon: '📋',
    items: [
      { to: '/wm/physical-inventory', label: 'Physical Count (MI01)' },
      { to: '/wm/adjustment',         label: 'Stock Adjustment' },
    ]
  },
  {
    label: 'Locations', icon: '🏗️',
    items: [
      { to: '/wm/wh-map',    label: 'Warehouse Map 🗺️' },
      { to: '/wm/bin-master',label: 'Bin / Location Master' },
    ]
  },
  {
    label: 'Reports', icon: '📊',
    items: [
      { to: '/wm/report',       label: 'Stock Report' },
      { to: '/wm/movement-log', label: 'Movement Register' },
    ]
  },
]

export default function WMLayout() {
  return (
    <ModuleLayout moduleName="WM" navItems={NAV_ITEMS} sidebarGroups={SIDEBAR_GROUPS}>
      <Suspense fallback={<PageLoader text="Loading WM page…" />}>
        <Routes>
          <Route index                    element={<WMDashboard />} />
          <Route path="stock"             element={<StockList />} />
          <Route path="bin-stock"         element={<BinStock />} />
          <Route path="reorder"           element={<ReorderList />} />
          <Route path="goods-receipt"     element={<GoodsReceipt />} />
          <Route path="goods-issue"       element={<GoodsIssue />} />
          <Route path="transfer"          element={<StockTransfer />} />
          <Route path="movement-log"      element={<MovementLog />} />
          <Route path="physical-inventory"element={<PhysicalInventory />} />
          <Route path="adjustment"        element={<StockAdjustment />} />
          <Route path="expiry"            element={<ExpiryTracking />} />
          <Route path="wh-map"            element={<WHMap />} />
          <Route path="bin-master"        element={<BinMaster />} />
          <Route path="report"            element={<StockReport />} />
          <Route path="*"                 element={<Navigate to="/wm" replace />} />
        </Routes>
      </Suspense>
    </ModuleLayout>
  )
}
