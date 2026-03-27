import React, { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import ModuleLayout from '@components/layout/ModuleLayout'
import PageLoader from '@components/ui/PageLoader'

const MDMDashboard     = lazy(() => import('./MDMDashboard'))
const ItemMaster       = lazy(() => import('./ItemMaster'))
const BOMList          = lazy(() => import('./BOMList'))
const RoutingMaster    = lazy(() => import('./RoutingMaster'))
const CustomerMaster   = lazy(() => import('./CustomerMaster'))
const VendorMaster     = lazy(() => import('./VendorMaster'))
const ChartOfAccounts  = lazy(() => import('./ChartOfAccounts'))
const CostCenters      = lazy(() => import('./CostCenters'))
const UOMMaster        = lazy(() => import('./UOMMaster'))
const HSNMaster        = lazy(() => import('./HSNMaster'))
const WarehouseMaster  = lazy(() => import('./WarehouseMaster'))
const QualityMaster    = lazy(() => import('./QualityMaster'))
const MaintenanceMaster= lazy(() => import('./MaintenanceMaster'))
const HRMaster         = lazy(() => import('./HRMaster'))

// ── Top nav tabs ──────────────────────────────────────
const NAV = [
  { to:'/mdm',           label:'Dashboard'   },
  { to:'/mdm/items',     label:'Items'        },
  { to:'/mdm/customers', label:'Customers'    },
  { to:'/mdm/vendors',   label:'Vendors'      },
  { to:'/mdm/accounts',  label:'Accounts'     },
]

// ── Sidebar groups ────────────────────────────────────
const SIDEBAR = [
  { label:'Overview', icon:'▸', items:[
    { to:'/mdm',               label:'MDM Dashboard' },
  ]},
  { label:'Item & BOM', icon:'📋', items:[
    { to:'/mdm/items',         label:'Item Master'          },
    { to:'/mdm/bom',           label:'Bill of Materials'    },
    { to:'/mdm/routing',       label:'Routing / Process'    },
    { to:'/mdm/uom',           label:'Unit of Measure'      },
    { to:'/mdm/hsn',           label:'HSN / SAC Codes'      },
  ]},
  { label:'Business Partners', icon:'▸', items:[
    { to:'/mdm/customers',     label:'Customer Master'      },
    { to:'/mdm/vendors',       label:'Vendor Master'        },
  ]},
  { label:'Finance Masters', icon:'💰', items:[
    { to:'/mdm/accounts',      label:'Chart of Accounts'    },
    { to:'/mdm/cost-centers',  label:'Cost Centers'         },
  ]},
  { label:'Operations', icon:'▸', items:[
    { to:'/mdm/warehouse',     label:'Warehouse / Locations'},
    { to:'/mdm/quality',       label:'Quality Masters'      },
    { to:'/mdm/maintenance',   label:'Maintenance Masters'  },
    { to:'/mdm/hr',            label:'HR Masters'           },
  ]},
]

export default function MDMLayout() {
  return (
    <ModuleLayout navItems={NAV} sidebarGroups={SIDEBAR}>
      <Suspense fallback={<PageLoader text="Loading MDM..."/>}>
        <Routes>
          <Route index                    element={<MDMDashboard />} />
          <Route path="items"             element={<ItemMaster />} />
          <Route path="bom"               element={<BOMList />} />
          <Route path="routing"           element={<RoutingMaster />} />
          <Route path="uom"               element={<UOMMaster />} />
          <Route path="hsn"               element={<HSNMaster />} />
          <Route path="customers"         element={<CustomerMaster />} />
          <Route path="vendors"           element={<VendorMaster />} />
          <Route path="accounts"          element={<ChartOfAccounts />} />
          <Route path="cost-centers"      element={<CostCenters />} />
          <Route path="warehouse"         element={<WarehouseMaster />} />
          <Route path="quality"           element={<QualityMaster />} />
          <Route path="maintenance"       element={<MaintenanceMaster />} />
          <Route path="hr"                element={<HRMaster />} />
          <Route path="*"                 element={<Navigate to="/mdm" replace />} />
        </Routes>
      </Suspense>
    </ModuleLayout>
  )
}
