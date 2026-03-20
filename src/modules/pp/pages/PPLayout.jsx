import React, { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import ModuleLayout from '@components/layout/ModuleLayout'
import PageLoader from '@components/ui/PageLoader'

// ── Original PP pages ────────────────────────────────────────────────────────
const PPDashboard     = lazy(() => import('./PPDashboard'))
const WOList          = lazy(() => import('./WOList'))
const WONew           = lazy(() => import('./WONew'))
const ProductionEntry = lazy(() => import('./ProductionEntry'))
const WOComplete      = lazy(() => import('./WOComplete'))
const GanttView       = lazy(() => import('./GanttView'))
const BOMList         = lazy(() => import('./BOMList'))
const BOMNew          = lazy(() => import('./BOMNew'))
const RoutingList     = lazy(() => import('./RoutingList'))
const RoutingNew      = lazy(() => import('./RoutingNew'))
const Machines        = lazy(() => import('./Machines'))
const CapacityPlan    = lazy(() => import('./CapacityPlan'))
const MRPRun          = lazy(() => import('./MRPRun'))
const MRPList         = lazy(() => import('./MRPList'))
const ProductionPlan  = lazy(() => import('./ProductionPlan'))
const PPReport        = lazy(() => import('./PPReport'))
const EfficiencyReport= lazy(() => import('./EfficiencyReport'))

// ── NEW: Item-wise routing, Batch, Mould ─────────────────────────────────────
const ItemMaster          = lazy(() => import('./ItemMaster'))
const ItemRouting         = lazy(() => import('./ItemRouting'))
const BatchManager        = lazy(() => import('./BatchManager'))
const MouldMaster         = lazy(() => import('./MouldMaster'))

// ── NEW: Job Work / Configurable PP pages ────────────────────────────────────
const PPConfigurator      = lazy(() => import('./PPConfigurator'))
const ProcessMaster       = lazy(() => import('./ProcessMaster'))
const WorkCenterMaster    = lazy(() => import('./WorkCenterMaster'))
const RoutingTemplate     = lazy(() => import('./RoutingTemplate'))
const CustomerMasterPP    = lazy(() => import('./CustomerMasterPP'))
const RateCardMaster      = lazy(() => import('./RateCardMaster'))
const JobCardList         = lazy(() => import('./JobCardList'))
const JobCardNew          = lazy(() => import('./JobCardNew'))
const JobQueueScheduler   = lazy(() => import('./JobQueueScheduler'))
const ProcessExecution    = lazy(() => import('./ProcessExecution'))
const WorkCenterDashboard = lazy(() => import('./WorkCenterDashboard'))
const JobTracker          = lazy(() => import('./JobTracker'))
const JobWorkInvoice      = lazy(() => import('./JobWorkInvoice'))

const SIDEBAR_GROUPS = [
  { label:'Job Work', icon:'', items:[
    { to:'/pp/job-cards',           label:'Job Cards' },
    { to:'/pp/job-card/new',        label:'New Job Card' },
    { to:'/pp/job-queue',           label:'Smart Scheduler' },
    { to:'/pp/process-execution',   label:'Process Execution' },
    { to:'/pp/job-tracker',         label:'Job Tracker' },
    { to:'/pp/wc-dashboard',        label:'Work Center Board' },
    { to:'/pp/job-work-invoice',    label:'Job Work Invoice' },
  ]},
  { label:'Item & Routing', icon:'', items:[
    { to:'/pp/items',               label:'Item Master' },
    { to:'/pp/item-routing',        label:'Item Routing' },
    { to:'/pp/batch-manager',       label:'Batch Manager' },
    { to:'/pp/mould-master',        label:'Mould / Cavity Master' },
  ]},
  { label:'PP Setup', icon:'', items:[
    { to:'/pp/configurator',        label:'PP Configurator' },
    { to:'/pp/process-master',      label:'Process Master' },
    { to:'/pp/work-centers',        label:'Work Center Master' },
    { to:'/pp/customer-master-pp',  label:'Customer Master' },
    { to:'/pp/rate-cards',          label:'Rate Card Master' },
  ]},
  { label:'Work Orders', icon:'', items:[
    { to:'/pp/wo',           label:'Work Order List (CO03)' },
    { to:'/pp/wo/new',       label:'Create Work Order (CO01)' },
    { to:'/pp/entry',        label:'Production Entry' },
    { to:'/pp/complete',     label:'Close Work Order' },
    { to:'/pp/gantt',        label:'Gantt View' },
  ]},
  { label:'BOM & Routing', icon:'', items:[
    { to:'/pp/bom',          label:'Bill of Materials (CS03)' },
    { to:'/pp/bom/new',      label:'Create BOM (CS01)' },
    { to:'/pp/routing',      label:'Routing List (CA03)' },
    { to:'/pp/routing/new',  label:'Create Routing (CA01)' },
    { to:'/pp/machines',     label:'Machines / Work Centres' },
  ]},
  { label:'Planning', icon:'', items:[
    { to:'/pp/mrp',          label:'MRP Run (MD01)' },
    { to:'/pp/mrp/results',  label:'MRP Results (MD04)' },
    { to:'/pp/capacity',     label:'Capacity Planning' },
    { to:'/pp/plan',         label:'Production Plan' },
  ]},
  { label:'Reports', icon:'', items:[
    { to:'/pp/report',       label:'Production Report' },
    { to:'/pp/efficiency',   label:'Machine Efficiency' },
  ]},
]

export default function PPLayout() {
  return (
    <ModuleLayout moduleName="PP" sidebarGroups={SIDEBAR_GROUPS}>
      <Suspense fallback={<PageLoader text="Loading PP page…"/>}>
        <Routes>
          <Route index element={<PPDashboard />} />

          {/* ── Item & Routing ───────────────────────────────────────── */}
          <Route path="items"               element={<ItemMaster />} />
          <Route path="item-routing"        element={<ItemRouting />} />
          <Route path="batch-manager"       element={<BatchManager />} />
          <Route path="mould-master"        element={<MouldMaster />} />

          {/* ── Job Work ─────────────────────────────────────────────── */}
          <Route path="job-cards"           element={<JobCardList />} />
          <Route path="job-card/new"        element={<JobCardNew />} />
          <Route path="job-queue"           element={<JobQueueScheduler />} />
          <Route path="process-execution"   element={<ProcessExecution />} />
          <Route path="job-tracker"         element={<JobTracker />} />
          <Route path="wc-dashboard"        element={<WorkCenterDashboard />} />
          <Route path="job-work-invoice"    element={<JobWorkInvoice />} />

          {/* ── PP Setup ─────────────────────────────────────────────── */}
          <Route path="configurator"        element={<PPConfigurator />} />
          <Route path="process-master"      element={<ProcessMaster />} />
          <Route path="work-centers"        element={<WorkCenterMaster />} />
          <Route path="routing-template"    element={<RoutingTemplate />} />
          <Route path="customer-master-pp"  element={<CustomerMasterPP />} />
          <Route path="rate-cards"          element={<RateCardMaster />} />

          {/* ── Original pages ───────────────────────────────────────── */}
          <Route path="wo"             element={<WOList />} />
          <Route path="wo/new"        element={<WONew />} />
          <Route path="entry"          element={<ProductionEntry />} />
          <Route path="complete"       element={<WOComplete />} />
          <Route path="gantt"          element={<GanttView />} />
          <Route path="bom"            element={<BOMList />} />
          <Route path="bom/new"        element={<BOMNew />} />
          <Route path="routing"        element={<RoutingList />} />
          <Route path="routing/new"    element={<RoutingNew />} />
          <Route path="machines"       element={<Machines />} />
          <Route path="capacity"       element={<CapacityPlan />} />
          <Route path="mrp"            element={<MRPRun />} />
          <Route path="mrp/results"    element={<MRPList />} />
          <Route path="plan"           element={<ProductionPlan />} />
          <Route path="report"         element={<PPReport />} />
          <Route path="efficiency"     element={<EfficiencyReport />} />

          <Route path="*" element={<Navigate to="/pp" replace />} />
        </Routes>
      </Suspense>
    </ModuleLayout>
  )
}
