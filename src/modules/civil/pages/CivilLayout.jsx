import React, { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import ModuleLayout from '@components/layout/ModuleLayout'
import PageLoader from '@components/ui/PageLoader'

const CivilDashboard  = lazy(() => import('./CivilDashboard'))
const ProjectList     = lazy(() => import('./ProjectList'))
const ProjectNew      = lazy(() => import('./ProjectNew'))
const ProjectDetail   = lazy(() => import('./ProjectDetail'))
const UnitWorkStatus  = lazy(() => import('./UnitWorkStatus'))
const BOQ             = lazy(() => import('./BOQ'))
const SiteProgress    = lazy(() => import('./SiteProgress'))
const DPRNew          = lazy(() => import('./DPRNew'))
const LabourRegister  = lazy(() => import('./LabourRegister'))
const MaterialIndent  = lazy(() => import('./MaterialIndent'))
const RABill          = lazy(() => import('./RABill'))
const ContractorBill  = lazy(() => import('./ContractorBill'))
const WeeklyBill      = lazy(() => import('./WeeklyBill'))
const EstVsActual     = lazy(() => import('./EstVsActual'))
const CivilMaterials  = lazy(() => import('./CivilMaterials'))
const SiteStock       = lazy(() => import('./SiteStock'))
const IssueSip        = lazy(() => import('./IssueSip'))
const ContractorWO    = lazy(() => import('./ContractorWO'))
const BOQMaster       = lazy(() => import('./BOQMaster'))
const BOQTemplateRates = lazy(() => import('./BOQTemplateRates'))
const RoomAddonRates = lazy(() => import('./RoomAddonRates'))
const CostEstimator   = lazy(() => import('./CostEstimator'))
const MaterialRateMaster = lazy(() => import('./MaterialRateMaster'))

const SIDEBAR_GROUPS = [
  { label:'Overview', items:[
    { to:'/civil',                  label:'🏗️ Civil Dashboard' },
  ]},
  { label:'Project Management', items:[
    { to:'/civil/projects',         label:'📋 Project List' },
    { to:'/civil/projects/new',     label:'➕ New Project' },
    { to:'/civil/boq',              label:'📐 BOQ' },
  ]},
  { label:'Daily Operations', items:[
    { to:'/civil/progress',         label:'📅 Site Progress (DPR)' },
    { to:'/civil/dpr/new',          label:'➕ New DPR Entry' },
    { to:'/civil/labour',           label:'👷 Labour Register' },
    { to:'/civil/indent',           label:'📦 Material Indent' },
  ]},
  { label:'Materials & Stock', items:[
    { to:'/civil/materials',        label:'📦 Material Master' },
    { to:'/civil/site-stock',       label:'📊 Site Stock' },
    { to:'/civil/issue-slip',       label:'📤 Issue Slip' },
  ]},
  { label:'Contractors', items:[
    { to:'/civil/contractor-wo',    label:'🤝 Contractor Work Orders' },
    { to:'/civil/bills',            label:'🧾 Contractor Bills' },
    { to:'/civil/weekly-bill',      label:'📋 Weekly Bill' },
  ]},
  { label:'Billing', items:[
    { to:'/civil/ra-bills',         label:'💰 RA Bills' },
  ]},
  { label:'Estimation', items:[
    { to:'/civil/estimator',        label:'🧮 Cost Estimator' },
    { to:'/civil/est-vs-actual',    label:'📊 Est vs Actual' },
  ]},
  { label:'Settings', items:[
    { to:'/civil/boq-master',       label:'📐 BOQ Activity Master' },
    { to:'/civil/boq-template-rates', label:'💰 BOQ Template Rates' },
    { to:'/civil/room-addon-rates', label:'🎨 Room Add-on Rates' },
    { to:'/civil/materials',        label:'📦 Material Master' },
    { to:'/civil/material-rates',   label:'📈 Material Rate Master' },
  ]},
  { label:'Tablet View', items:[
    { to:'/civil/tablet',           label:'📱 Supervisor Tablet' },
  ]},
]

export default function CivilLayout() {
  return (
    <ModuleLayout moduleName="Civil" sidebarGroups={SIDEBAR_GROUPS}>
      <Suspense fallback={<PageLoader text="Loading Civil…" />}>
        <Routes>
          <Route index                    element={<CivilDashboard />} />
          <Route path="projects"          element={<ProjectList />} />
          <Route path="projects/new"      element={<ProjectNew />} />
          <Route path="projects/:id"      element={<ProjectDetail />} />
          <Route path="units/:unitId/work-status" element={<UnitWorkStatus />} />
          <Route path="boq"               element={<BOQ />} />
          <Route path="progress"          element={<SiteProgress />} />
          <Route path="dpr/new"           element={<DPRNew />} />
          <Route path="labour"            element={<LabourRegister />} />
          <Route path="indent"            element={<MaterialIndent />} />
          <Route path="ra-bills"          element={<RABill />} />
          <Route path="bills"             element={<ContractorBill />} />
          <Route path="weekly-bill"        element={<WeeklyBill />} />
          <Route path="est-vs-actual"       element={<EstVsActual />} />
          <Route path="materials"         element={<CivilMaterials />} />
          <Route path="site-stock"        element={<SiteStock />} />
          <Route path="issue-slip"        element={<IssueSip />} />
          <Route path="contractor-wo"     element={<ContractorWO />} />
          <Route path="boq-master"         element={<BOQMaster />} />
          <Route path="boq-template-rates" element={<BOQTemplateRates />} />
          <Route path="room-addon-rates" element={<RoomAddonRates />} />
          <Route path="estimator"          element={<CostEstimator />} />
          <Route path="material-rates"      element={<MaterialRateMaster />} />
          <Route path="*"                 element={<Navigate to="/civil" replace />} />
        </Routes>
      </Suspense>
    </ModuleLayout>
  )
}
