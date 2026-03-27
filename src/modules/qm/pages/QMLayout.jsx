import React, { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import ModuleLayout from '@components/layout/ModuleLayout'
import PageLoader from '@components/ui/PageLoader'

const QMDashboard      = lazy(() => import('./QMDashboard'))
const InspectionList   = lazy(() => import('./InspectionList'))
const InspectionNew    = lazy(() => import('./InspectionNew'))
const NCRList          = lazy(() => import('./NCRList'))
const NCRNew           = lazy(() => import('./NCRNew'))
const CAPAList         = lazy(() => import('./CAPAList'))
const CAPANew          = lazy(() => import('./CAPANew'))
const QualityPlan      = lazy(() => import('./QualityPlan'))
const SamplingPlan     = lazy(() => import('./SamplingPlan'))
const CertificateList  = lazy(() => import('./CertificateList'))
const VendorQuality    = lazy(() => import('./VendorQuality'))
const QualityReport    = lazy(() => import('./QualityReport'))

const SIDEBAR_GROUPS = [
  { label:'Inspection', icon:'🔍', items:[
    {to:'/qm',              label:'QM Dashboard'},
    {to:'/qm/inspection',   label:'Inspection Lot List'},
    {to:'/qm/inspection/new',label:'New Inspection (QA01)'},
  ]},
  { label:'Non-Conformance', icon:'▸', items:[
    {to:'/qm/ncr',          label:'NCR Register'},
    {to:'/qm/ncr/new',      label:'Raise NCR'},
    {to:'/qm/capa',         label:'CAPA List'},
    {to:'/qm/capa/new',     label:'New CAPA'},
  ]},
  { label:'Planning', icon:'▸', items:[
    {to:'/qm/plan',         label:'Quality Plans'},
    {to:'/qm/sampling',     label:'Sampling Plans (AQL)'},
  ]},
  { label:'Certificates & Reports', icon:'📦', items:[
    {to:'/qm/certificates', label:'COC / Test Certificates'},
    {to:'/qm/vendor',       label:'Vendor Quality Rating'},
    {to:'/qm/report',       label:'Quality Report'},
  ]},
]

export default function QMLayout() {
  return (
    <ModuleLayout moduleName="QM" sidebarGroups={SIDEBAR_GROUPS}>
      <Suspense fallback={<PageLoader text="Loading QM page…"/>}>
        <Routes>
          <Route index                element={<QMDashboard />} />
          <Route path="inspection"    element={<InspectionList />} />
          <Route path="inspection/new" element={<InspectionNew />} />
          <Route path="ncr"           element={<NCRList />} />
          <Route path="ncr/new"       element={<NCRNew />} />
          <Route path="capa"          element={<CAPAList />} />
          <Route path="capa/new"      element={<CAPANew />} />
          <Route path="plan"          element={<QualityPlan />} />
          <Route path="sampling"      element={<SamplingPlan />} />
          <Route path="certificates"  element={<CertificateList />} />
          <Route path="vendor"        element={<VendorQuality />} />
          <Route path="report"        element={<QualityReport />} />
          <Route path="*"             element={<Navigate to="/qm" replace />} />
        </Routes>
      </Suspense>
    </ModuleLayout>
  )
}
