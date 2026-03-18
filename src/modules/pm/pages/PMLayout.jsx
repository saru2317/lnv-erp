import React, { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import ModuleLayout from '@components/layout/ModuleLayout'
import PageLoader from '@components/ui/PageLoader'

const PMDashboard     = lazy(() => import('./PMDashboard'))
const BreakdownList   = lazy(() => import('./BreakdownList'))
const BreakdownNew    = lazy(() => import('./BreakdownNew'))
const PMSchedule      = lazy(() => import('./PMSchedule'))
const PMWorkOrder     = lazy(() => import('./PMWorkOrder'))
const MaintenanceLog  = lazy(() => import('./MaintenanceLog'))
const SparePartsList  = lazy(() => import('./SparePartsList'))
const SpareIssue      = lazy(() => import('./SpareIssue'))
const MachineRegister = lazy(() => import('./MachineRegister'))
const CalibrationList = lazy(() => import('./CalibrationList'))
const PMCostReport    = lazy(() => import('./PMCostReport'))
const PMReport        = lazy(() => import('./PMReport'))

const SIDEBAR_GROUPS = [
  { label:'Breakdown', icon:'🔴', items:[
    {to:'/pm',              label:'PM Dashboard'},
    {to:'/pm/breakdown',    label:'Breakdown Register'},
    {to:'/pm/breakdown/new',label:'Report Breakdown'},
  ]},
  { label:'Preventive Maintenance', icon:'🔧', items:[
    {to:'/pm/schedule',     label:'PM Schedule (IW31)'},
    {to:'/pm/workorder',    label:'Maintenance Work Orders'},
    {to:'/pm/log',          label:'Maintenance Log'},
  ]},
  { label:'Spares & Calibration', icon:'⚙️', items:[
    {to:'/pm/spares',       label:'Spare Parts Register'},
    {to:'/pm/spares/issue', label:'Issue Spare Parts'},
    {to:'/pm/calibration',  label:'Calibration Register'},
  ]},
  { label:'Masters & Reports', icon:'📊', items:[
    {to:'/pm/machines',     label:'Machine Register'},
    {to:'/pm/cost',         label:'Maintenance Cost Report'},
    {to:'/pm/report',       label:'PM Summary Report'},
  ]},
]

export default function PMLayout() {
  return (
    <ModuleLayout moduleName="PM" sidebarGroups={SIDEBAR_GROUPS}>
      <Suspense fallback={<PageLoader text="Loading PM page…"/>}>
        <Routes>
          <Route index                  element={<PMDashboard />} />
          <Route path="breakdown"       element={<BreakdownList />} />
          <Route path="breakdown/new"   element={<BreakdownNew />} />
          <Route path="schedule"        element={<PMSchedule />} />
          <Route path="workorder"       element={<PMWorkOrder />} />
          <Route path="log"             element={<MaintenanceLog />} />
          <Route path="spares"          element={<SparePartsList />} />
          <Route path="spares/issue"    element={<SpareIssue />} />
          <Route path="calibration"     element={<CalibrationList />} />
          <Route path="machines"        element={<MachineRegister />} />
          <Route path="cost"            element={<PMCostReport />} />
          <Route path="report"          element={<PMReport />} />
          <Route path="*"               element={<Navigate to="/pm" replace />} />
        </Routes>
      </Suspense>
    </ModuleLayout>
  )
}
