import React, { lazy, Suspense, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import ModuleLayout from '@components/layout/ModuleLayout'
import PageLoader from '@components/ui/PageLoader'
import { KPI_MASTER_DEFAULT, ACTUALS_DEFAULT, EMPLOYEES_DEFAULT, ASSIGNMENTS_DEFAULT, INC_TIERS_DEFAULT } from './_kpiData'

const KPIReport     = lazy(() => import('./KPIReport'))
const Scorecard     = lazy(() => import('./Scorecard'))
const IncentiveCalc = lazy(() => import('./IncentiveCalc'))
const MonthlyEntry  = lazy(() => import('./MonthlyEntry'))
const KPIMaster     = lazy(() => import('./KPIMaster'))
const Assignments   = lazy(() => import('./Assignments'))
const TargetSetting = lazy(() => import('./TargetSetting'))
const KPIEmployees  = lazy(() => import('./KPIEmployees'))

const NAV_ITEMS = [
  { to:'/kpi',              label:'📊 KPI Report' },
  { to:'/kpi/scorecard',    label:'🎯 Scorecard' },
  { to:'/kpi/incentive',    label:'💰 Incentive' },
  { to:'/kpi/entry',        label:'✏️ Entry' },
  { to:'/kpi/master',       label:'📋 KPI Master' },
]

const SIDEBAR_GROUPS = [
  { label:'KPI Reports', icon:'📊', items:[
    { to:'/kpi',            label:'📊 KPI Performance Report' },
    { to:'/kpi/scorecard',  label:'🎯 Individual Scorecard' },
    { to:'/kpi/incentive',  label:'💰 Incentive Calculator' },
  ]},
  { label:'Data Entry', icon:'✏️', items:[
    { to:'/kpi/entry',      label:'✏️ Monthly Entry' },
    { to:'/kpi/targets',    label:'🎯 Target Setting' },
  ]},
  { label:'Configuration', icon:'⚙️', items:[
    { to:'/kpi/master',     label:'📋 KPI Master' },
    { to:'/kpi/assign',     label:'👥 KPI Assignment' },
    { to:'/kpi/employees',  label:'🧑 Employees / Roles' },
  ]},
]

// Shared state wrapper — all pages share same KPI data
export default function KPILayout() {
  const [kpiMaster,   setKpiMaster]   = useState(KPI_MASTER_DEFAULT)
  const [actuals,     setActuals]     = useState(ACTUALS_DEFAULT)
  const [employees,   setEmployees]   = useState(EMPLOYEES_DEFAULT)
  const [assignments, setAssignments] = useState(ASSIGNMENTS_DEFAULT)
  const [tiers,       setTiers]       = useState(INC_TIERS_DEFAULT)

  const handleMonthEntry = (month, vals) => {
    setActuals(prev => {
      const next = { ...prev }
      Object.entries(vals).forEach(([code, val]) => {
        if (!next[code]) next[code] = {}
        next[code] = { ...next[code], [month]: val !== '' ? val : null }
      })
      return next
    })
  }

  const sharedProps = { kpiMaster, actuals, employees, assignments, tiers }

  return (
    <ModuleLayout moduleName="KPI" navItems={NAV_ITEMS} sidebarGroups={SIDEBAR_GROUPS}>
      <Suspense fallback={<PageLoader text="Loading KPI…" />}>
        <Routes>
          <Route index             element={<KPIReport    {...sharedProps} />} />
          <Route path="scorecard"  element={<Scorecard    {...sharedProps} />} />
          <Route path="incentive"  element={<IncentiveCalc {...sharedProps} />} />
          <Route path="entry"      element={<MonthlyEntry  {...sharedProps} onSave={handleMonthEntry} />} />
          <Route path="master"     element={<KPIMaster     {...sharedProps} onUpdate={setKpiMaster} />} />
          <Route path="assign"     element={<Assignments   {...sharedProps} />} />
          <Route path="targets"    element={<TargetSetting {...sharedProps} />} />
          <Route path="employees"  element={<KPIEmployees  {...sharedProps} />} />
          <Route path="*"          element={<Navigate to="/kpi" replace />} />
        </Routes>
      </Suspense>
    </ModuleLayout>
  )
}
