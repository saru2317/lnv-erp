import React, { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import ModuleLayout from '@components/layout/ModuleLayout'
import PageLoader from '@components/ui/PageLoader'

const AMDashboard   = lazy(() => import('./AMDashboard'))
const AssetRegister = lazy(() => import('./AssetRegister'))
const AssetIssue    = lazy(() => import('./AssetIssue'))
const Depreciation  = lazy(() => import('./Depreciation'))
const PropertyRegister = lazy(() => import('./PropertyRegister'))

const NAV_ITEMS = [
  { to:'/am',            label:' Home' },
  { to:'/am/assets',     label:' Assets' },
  { to:'/am/issue',      label:' Issue/Return' },
  { to:'/am/depreciation',label:' Depreciation' },
  { to:'/am/property',   label:' Property' },
]

const SIDEBAR_GROUPS = [
  { label:'Company Assets', icon:'🏗️', items:[
    { to:'/am',                label:'Asset Dashboard' },
    { to:'/am/assets',         label:'Asset Register' },
    { to:'/am/issue',          label:'Asset Issue / Return' },
    { to:'/am/depreciation',   label:'Depreciation Run' },
    { to:'/am/disposal',       label:'Disposal / Scrap' },
    { to:'/am/assets',         label:'Asset Movement' },
  ]},
  { label:'Company Property', icon:'▸', items:[
    { to:'/am/property',       label:'Property Register' },
    { to:'/am/property',       label:'Lease / Rent Management' },
    { to:'/am/property',       label:'Property Maintenance' },
  ]},
]

export default function AMLayout() {
  return (
    <ModuleLayout moduleName="AM" navItems={NAV_ITEMS} sidebarGroups={SIDEBAR_GROUPS}>
      <Suspense fallback={<PageLoader text="Loading AM…" />}>
        <Routes>
          <Route index               element={<AMDashboard />} />
          <Route path="assets"       element={<AssetRegister />} />
          <Route path="issue"        element={<AssetIssue />} />
          <Route path="depreciation" element={<Depreciation />} />
          <Route path="property"     element={<PropertyRegister />} />
          <Route path="*"            element={<Navigate to="/am" replace />} />
        </Routes>
      </Suspense>
    </ModuleLayout>
  )
}
