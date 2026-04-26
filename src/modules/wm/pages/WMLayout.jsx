/**
 * Warehouse Module Layout — WM
 * Route: /wm/*  (App.jsx line 52)
 */
import React, { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import ModuleLayout from '@components/layout/ModuleLayout'
import PageLoader from '@components/ui/PageLoader'

const WMDashboard       = lazy(() => import('./WMDashboard'))
const GateEntryList     = lazy(() => import('./GateEntryList'))
const GRNList           = lazy(() => import('./GRNList'))
const GRNNew            = lazy(() => import('./GRNNew'))
const GoodsReceipt      = lazy(() => import('./GoodsReceipt'))
const GoodsIssue        = lazy(() => import('./GoodsIssue'))
const StockList         = lazy(() => import('./StockList'))
const StockReport       = lazy(() => import('./StockReport'))
const StockTransfer     = lazy(() => import('./StockTransfer'))
const StockAdjustment   = lazy(() => import('./StockAdjustment'))
const BinMaster         = lazy(() => import('./BinMaster'))
const BinStock          = lazy(() => import('./BinStock'))
const WHMap             = lazy(() => import('./WHMap'))
const MovementLog       = lazy(() => import('./MovementLog'))
const PhysicalInventory = lazy(() => import('./PhysicalInventory'))
const ReorderList       = lazy(() => import('./ReorderList'))
const ExpiryTracking    = lazy(() => import('./ExpiryTracking'))

const NAV_ITEMS = [
  { to:'/wm',              label:'Home'          },
  { to:'/wm/gate-entry',   label:'Gate Entry'    },
  { to:'/wm/grn',          label:'GRN / Receipt' },
  { to:'/wm/qc',           label:'QC Inspection' },
  { to:'/wm/stock',        label:'Stock'         },
  { to:'/wm/reports',      label:'Reports'       },
]

const SIDEBAR_GROUPS = [
  {
    label:'Gate Management', icon:'🚛',
    items:[
      { to:'/wm/gate-entry',  label:'Gate Entry Register' },
    ]
  },
  {
    label:'Goods Receipt / Issue', icon:'📦',
    items:[
      { to:'/wm/grn',          label:'GRN List (MB51)'   },
      { to:'/wm/grn/new',      label:'Record GRN (MIGO)' },
      { to:'/wm/goods-receipt',label:'Goods Receipt'     },
      { to:'/wm/goods-issue',  label:'Goods Issue'       },
    ]
  },
  {
    label:'Stock Management', icon:'📊',
    items:[
      { to:'/wm/stock',        label:'Stock List'        },
      { to:'/wm/stock/bin',    label:'Bin-wise Stock'    },
      { to:'/wm/transfer',     label:'Stock Transfer'    },
      { to:'/wm/adjustment',   label:'Stock Adjustment'  },
      { to:'/wm/physical',     label:'Physical Inventory'},
      { to:'/wm/reorder',      label:'Reorder List'      },
      { to:'/wm/expiry',       label:'Expiry Tracking'   },
    ]
  },
  {
    label:'Reports & Maps', icon:'📋',
    items:[
      { to:'/wm/movement',     label:'Movement Log'      },
      { to:'/wm/report',       label:'Stock Report'      },
      { to:'/wm/map',          label:'Warehouse Map'     },
    ]
  },
]

export default function WMLayout() {
  return (
    <ModuleLayout moduleName="WM"
      navItems={NAV_ITEMS}
      sidebarGroups={SIDEBAR_GROUPS}>
      <Suspense fallback={<PageLoader text="Loading WM..." />}>
        <Routes>
          <Route index                 element={<WMDashboard />}       />
          <Route path="gate-entry"     element={<GateEntryList />}     />
          <Route path="grn"            element={<GRNList />}           />
          <Route path="grn/new"        element={<GRNNew />}            />
          <Route path="goods-receipt"  element={<GoodsReceipt />}      />
          <Route path="goods-issue"    element={<GoodsIssue />}        />
          <Route path="stock"          element={<StockList />}         />
          <Route path="stock/bin"      element={<BinStock />}          />
          <Route path="transfer"       element={<StockTransfer />}     />
          <Route path="adjustment"     element={<StockAdjustment />}   />
          <Route path="physical"       element={<PhysicalInventory />} />
          <Route path="reorder"        element={<ReorderList />}       />
          <Route path="expiry"         element={<ExpiryTracking />}    />
          <Route path="movement"       element={<MovementLog />}       />
          <Route path="report"         element={<StockReport />}       />
          <Route path="map"            element={<WHMap />}             />
          <Route path="bin"            element={<BinMaster />}         />
          <Route path="*"              element={<Navigate to="/wm" replace />} />
        </Routes>
      </Suspense>
    </ModuleLayout>
  )
}
