import React, { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import ModuleLayout from '@components/layout/ModuleLayout'
import PageLoader from '@components/ui/PageLoader'
const CivilDashboard = lazy(() => import('./CivilDashboard'))
const ProjectList    = lazy(() => import('./ProjectList'))
const BOQ            = lazy(() => import('./BOQ'))
const SiteProgress   = lazy(() => import('./SiteProgress'))
const ContractorBill = lazy(() => import('./ContractorBill'))
const NAV_ITEMS = [
  {to:'/civil',              label:' Home'},
  {to:'/civil/projects',     label:' Projects'},
  {to:'/civil/boq',          label:' BOQ'},
  {to:'/civil/progress',     label:' Progress'},
  {to:'/civil/bills',        label:' Bills'},
]
const SIDEBAR_GROUPS = [
  { label:'Project Management', icon:'', items:[
    {to:'/civil',           label:'Civil Dashboard'},
    {to:'/civil/projects',  label:'Project List'},
    {to:'/civil/boq',       label:'Bill of Quantities (BOQ)'},
    {to:'/civil/progress',  label:'Site Progress'},
    {to:'/civil/bills',     label:'Contractor Bills'},
    {to:'/civil/materials', label:'Material Indent (Civil)'},
    {to:'/civil/labour',    label:'Labour Register'},
  ]},
]
export default function CivilLayout() {
  return (
    <ModuleLayout moduleName="Civil" navItems={NAV_ITEMS} sidebarGroups={SIDEBAR_GROUPS}>
      <Suspense fallback={<PageLoader text="Loading Civil…" />}>
        <Routes>
          <Route index            element={<CivilDashboard />} />
          <Route path="projects"  element={<ProjectList />} />
          <Route path="boq"       element={<BOQ />} />
          <Route path="progress"  element={<SiteProgress />} />
          <Route path="bills"     element={<ContractorBill />} />
          <Route path="*"         element={<Navigate to="/civil" replace />} />
        </Routes>
      </Suspense>
    </ModuleLayout>
  )
}
