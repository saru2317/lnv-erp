import React, { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import ModuleLayout from '@components/layout/ModuleLayout'
import PageLoader from '@components/ui/PageLoader'

const PPDashboard      = lazy(() => import('./PPDashboard'))
const PPConfigurator   = lazy(() => import('./PPConfigurator'))
const ProductionPlan   = lazy(() => import('./ProductionPlan'))
const WOList           = lazy(() => import('./WOList'))
const WONew            = lazy(() => import('./WONew'))
const WOComplete       = lazy(() => import('./WOComplete'))
const ProductionEntry  = lazy(() => import('./ProductionEntry'))
const MRPRun           = lazy(() => import('./MRPRun'))
const MRPList          = lazy(() => import('./MRPList'))
const CapacityPlan     = lazy(() => import('./CapacityPlan'))
const GanttView        = lazy(() => import('./GanttView'))
const ProcessMaster    = lazy(() => import('./ProcessMaster'))
const WorkCenterMaster = lazy(() => import('./WorkCenterMaster'))
const MouldMaster      = lazy(() => import('./MouldMaster'))
const BatchManager     = lazy(() => import('./BatchManager'))
const JobCardList      = lazy(() => import('./JobCardList'))
const JobCardNew       = lazy(() => import('./JobCardNew'))
const JobTracker       = lazy(() => import('./JobTracker'))
const ProcessExecution = lazy(() => import('./ProcessExecution'))
const JobWorkInvoice   = lazy(() => import('./JobWorkInvoice'))
const BOMList          = lazy(() => import('./BOMList'))
const BOMNew           = lazy(() => import('./BOMNew'))
const RoutingList      = lazy(() => import('./RoutingList'))
const RoutingNew       = lazy(() => import('./RoutingNew'))
const WorkCenterBoard  = lazy(() => import('./WorkCenterDashboard'))
const MOList           = lazy(() => import('./MOList'))
const PPReport         = lazy(() => import('./PPReport'))
const EfficiencyReport = lazy(() => import('./EfficiencyReport'))

// ── Role check ────────────────────────────────────────────────────
// Role check — case insensitive, includes all admin variants
const OPERATOR_ONLY_ROLES = ['worker','operator','floor','production_worker','line_operator']
const getRole    = () => { try { return (JSON.parse(localStorage.getItem('lnv_user')||'{}').role || '').toLowerCase().trim() } catch { return '' } }
// Show PLANNER sidebar unless role is explicitly an operator-only role
const isPlanner  = () => !OPERATOR_ONLY_ROLES.includes(getRole())
// MO enabled check — reads from sessionStorage (set on app load from pp/config API)
const isMOEnabled = () => { try { return JSON.parse(sessionStorage.getItem('pp_config')||'{}').moEnabled === true } catch { return false } }

// ── PLANNER sidebar ───────────────────────────────────────────────
// WO New is NOT here — accessed only via Plan → [Create WO] button
const PLANNER_SIDEBAR = [
  { label:'Overview', icon:'📊', items:[
    { to:'/pp',              label:'PP Dashboard' },
  ]},
  { label:'Planning', icon:'📋', items:[
    { to:'/pp/plan',         label:'Production Plan'         },
    { to:'/pp/wo',           label:'Work Order List (CO03)'  },
    { to:'/pp/gantt',        label:'Gantt View'              },
    { to:'/pp/capacity',     label:'Capacity Planning'       },
  ]},
  // MO group — shows only if moEnabled in config (sidebar items filtered at render)
  { label:'Manufacturing Orders', icon:'🏭', items:[
    { to:'/pp/mo',          label:'MO Register'              },
    { to:'/pp/mo/new',      label:'New Manufacturing Order'  },
  ], moOnly: true },  // moOnly flag — hidden when MO disabled

  { label:'MRP', icon:'🔄', items:[
    { to:'/pp/mrp',          label:'MRP Run (MD01)'    },
    { to:'/pp/mrp/results',  label:'MRP Results (MD04)'},
  ]},
  { label:'Job Work', icon:'🔧', items:[
    { to:'/pp/job-cards',    label:'Job Card Register' },
    { to:'/pp/job-card/new', label:'New Job Card'      },
    { to:'/pp/job-invoice',  label:'Job Work Invoice'  },
  ]},
  { label:'BOM & Routing', icon:'📐', items:[
    { to:'/pp/bom',          label:'Bill of Materials (CS03)' },
    { to:'/pp/bom/new',      label:'Create BOM (CS01)'        },
    { to:'/pp/routing',      label:'Routing List (CA03)'      },
    { to:'/pp/routing/new',  label:'Create Routing (CA01)'    },
  ]},
  { label:'Reports', icon:'📈', items:[
    { to:'/pp/report',       label:'Production Report'  },
    { to:'/pp/efficiency',   label:'Machine Efficiency' },
  ]},
  { label:'PP Setup', icon:'⚙️', items:[
    { to:'/pp/process-master',label:'Process Master'          },
    { to:'/pp/work-centers',  label:'Work Center Master'      },
    { to:'/pp/mould-master',  label:'Mould / Cavity Master'   },
    { to:'/pp/configurator',  label:'PP Configurator'         },
  ]},
]

// ── OPERATOR sidebar ─────────────────────────────────────────────
const OPERATOR_SIDEBAR = [
  { label:'Overview', icon:'📊', items:[
    { to:'/pp',               label:'PP Dashboard' },
  ]},
  { label:'My Production', icon:'⚙️', items:[
    { to:'/pp/entry',         label:'Production Entry'  },   // ← main screen
    { to:'/pp/wo',            label:'Work Order Queue'  },   // read-only list
    { to:'/pp/complete',      label:'Close Work Order'  },
    { to:'/pp/wc-board',      label:'Work Center Board' },
  ]},
  { label:'Batch / Mould', icon:'🪣', items:[
    { to:'/pp/batch-manager', label:'Batch Manager'  },
    { to:'/pp/mould-master',  label:'Mould Status'   },
  ]},
  { label:'Job Work', icon:'🔧', items:[
    { to:'/pp/job-tracker',   label:'Job Tracker'       },
    { to:'/pp/process-exec',  label:'Process Execution' },
  ]},
]

// ── Guard component ───────────────────────────────────────────────
function PlannerGuard({ children }) {
  if (!isPlanner()) return (
    <div style={{ padding:80, textAlign:'center' }}>
      <div style={{ fontSize:48, marginBottom:14 }}>🔒</div>
      <div style={{ fontWeight:800, fontSize:18, color:'#333', fontFamily:'Syne,sans-serif' }}>
        Planning Access Only
      </div>
      <div style={{ fontSize:13, color:'#6C757D', marginTop:8, lineHeight:1.7 }}>
        This page is restricted to the planning team.<br/>
        Contact your plant manager for access.
      </div>
    </div>
  )
  return children
}

export default function PPLayout() {
  return (
    <ModuleLayout moduleName="PP" sidebarGroups={
      (isPlanner() ? PLANNER_SIDEBAR : OPERATOR_SIDEBAR)
        .filter(g => !g.moOnly || isMOEnabled())  // hide MO group if not enabled
    }>
      <Suspense fallback={<PageLoader text="Loading PP…" />}>
        <Routes>
          <Route index element={<PPDashboard />} />

          {/* Manufacturing Orders — shown when moEnabled */}
          <Route path="mo"              element={<PlannerGuard><MOList /></PlannerGuard>}          />
          <Route path="mo/new"          element={<PlannerGuard><MOList /></PlannerGuard>}          />
          <Route path="mo/:id"          element={<PlannerGuard><MOList /></PlannerGuard>}          />

          {/* Planning — planner only */}
          <Route path="plan"            element={<PlannerGuard><ProductionPlan /></PlannerGuard>}     />
          <Route path="mrp"             element={<PlannerGuard><MRPRun /></PlannerGuard>}              />
          <Route path="mrp/results"     element={<MRPList />}          />
          <Route path="capacity"        element={<PlannerGuard><CapacityPlan /></PlannerGuard>}        />
          <Route path="gantt"           element={<GanttView />}        />

          {/* Work Orders */}
          <Route path="wo"              element={<WOList />}           />
          {/* WO New only via planId param from Production Plan */}
          <Route path="wo/new"          element={<PlannerGuard><WONew /></PlannerGuard>}               />
          <Route path="wo/:id"          element={<WONew />}            />

          {/* Production — operator primary */}
          <Route path="entry"           element={<ProductionEntry />}  />
          <Route path="complete"        element={<WOComplete />}       />
          <Route path="wc-board"        element={<WorkCenterBoard />}  />
          <Route path="batch-manager"   element={<BatchManager />}     />

          {/* Job Work */}
          <Route path="job-cards"       element={<JobCardList />}      />
          <Route path="job-card/new"    element={<PlannerGuard><JobCardNew /></PlannerGuard>}          />
          <Route path="job-card/:id"    element={<JobCardNew />}       />
          <Route path="job-tracker"     element={<JobTracker />}       />
          <Route path="process-exec"    element={<ProcessExecution />} />
          <Route path="job-invoice"     element={<PlannerGuard><JobWorkInvoice /></PlannerGuard>}      />

          {/* BOM & Routing */}
          <Route path="bom"             element={<BOMList />}          />
          <Route path="bom/new"         element={<PlannerGuard><BOMNew /></PlannerGuard>}              />
          <Route path="bom/:id"         element={<BOMNew />}           />
          <Route path="routing"         element={<RoutingList />}      />
          <Route path="routing/new"     element={<PlannerGuard><RoutingNew /></PlannerGuard>}          />
          <Route path="routing/:id"     element={<RoutingNew />}       />

          {/* Masters */}
          <Route path="process-master"  element={<PlannerGuard><ProcessMaster /></PlannerGuard>}       />
          <Route path="work-centers"    element={<PlannerGuard><WorkCenterMaster /></PlannerGuard>}    />
          <Route path="mould-master"    element={<MouldMaster />}      />
          <Route path="configurator"    element={<PlannerGuard><PPConfigurator /></PlannerGuard>}      />

          {/* Reports */}
          <Route path="report"          element={<PPReport />}         />
          <Route path="efficiency"      element={<EfficiencyReport />} />

          <Route path="*"               element={<Navigate to="/pp" replace />} />
        </Routes>
      </Suspense>
    </ModuleLayout>
  )
}
