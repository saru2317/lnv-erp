import React, { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import ModuleLayout from '@components/layout/ModuleLayout'

const CRMDashboard       = lazy(() => import('./pages/CRMDashboard'))
const LeadList           = lazy(() => import('./pages/LeadList'))
const LeadNew            = lazy(() => import('./pages/LeadNew'))
const LeadView           = lazy(() => import('./pages/LeadView'))
const OpportunityList    = lazy(() => import('./pages/OpportunityList'))
const OpportunityView    = lazy(() => import('./pages/OpportunityView'))
const ActivityLog        = lazy(() => import('./pages/ActivityLog'))
const CustomerInteraction= lazy(() => import('./pages/CustomerInteraction'))
const CRMReports         = lazy(() => import('./pages/CRMReports'))
const CompetitorMaster   = lazy(() => import('./pages/CompetitorMaster'))
const CompetitorAnalysis = lazy(() => import('./pages/CompetitorAnalysis'))

const NAV_ITEMS = [
  { to:'/crm',              label:'🏠 Home'         },
  { to:'/crm/leads',        label:'📌 Leads'        },
  { to:'/crm/opportunities',label:'💰 Pipeline'     },
  { to:'/crm/activities',   label:'📅 Activities'   },
  { to:'/crm/reports',      label:'📊 Reports'      },
]

const SIDEBAR_GROUPS = [
  { label:'Leads', icon:'📌', items:[
    { to:'/crm/leads',        label:'All Leads'            },
    { to:'/crm/leads/new',    label:'New Lead'             },
  ]},
  { label:'Pipeline', icon:'💰', items:[
    { to:'/crm/opportunities',label:'Opportunities'        },
  ]},
  { label:'Activities', icon:'📅', items:[
    { to:'/crm/activities',   label:'Activity Log'         },
    { to:'/crm/interactions', label:'Customer Interactions'},
  ]},
  { label:'Reports', icon:'📊', items:[
    { to:'/crm/reports',             label:'Win/Loss Analysis'   },
    { to:'/crm/competitor-analysis', label:'Competitor Analysis' },
  ]},
  { label:'Competitors', icon:'🎯', items:[
    { to:'/crm/competitors',         label:'Competitor Master'   },
  ]},
]

export default function CRMLayout() {
  return (
    <ModuleLayout moduleName="CRM" navItems={NAV_ITEMS} sidebarGroups={SIDEBAR_GROUPS}>
      <Suspense fallback={<div style={{padding:40,textAlign:'center',color:'#6C757D'}}>Loading...</div>}>
        <Routes>
          <Route index                      element={<CRMDashboard />}        />
          <Route path="leads"               element={<LeadList />}            />
          <Route path="leads/new"           element={<LeadNew />}             />
          <Route path="leads/:id"           element={<LeadView />}            />
          <Route path="opportunities"       element={<OpportunityList />}     />
          <Route path="opportunities/:id"   element={<OpportunityView />}     />
          <Route path="activities"          element={<ActivityLog />}         />
          <Route path="interactions"        element={<CustomerInteraction />} />
          <Route path="reports"             element={<CRMReports />}          />
          <Route path="competitors"         element={<CompetitorMaster />}    />
          <Route path="competitor-analysis" element={<CompetitorAnalysis />}  />
          <Route path="*"                   element={<Navigate to="/crm" replace />} />
        </Routes>
      </Suspense>
    </ModuleLayout>
  )
}
