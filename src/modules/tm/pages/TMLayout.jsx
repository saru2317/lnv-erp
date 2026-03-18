import React, { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import ModuleLayout from '@components/layout/ModuleLayout'
import PageLoader from '@components/ui/PageLoader'

const TMDashboard  = lazy(() => import('./TMDashboard'))
const TripBooking  = lazy(() => import('./TripBooking'))
const TripSheet    = lazy(() => import('./TripSheet'))
const VehicleMaster= lazy(() => import('./VehicleMaster'))
const FuelLog      = lazy(() => import('./FuelLog'))

const NAV_ITEMS = [
  { to:'/tm',          label:'🏠 Home' },
  { to:'/tm/booking',  label:'📋 Bookings' },
  { to:'/tm/trips',    label:'🚚 Trips' },
  { to:'/tm/vehicles', label:'🚗 Vehicles' },
  { to:'/tm/fuel',     label:'⛽ Fuel' },
]

const SIDEBAR_GROUPS = [
  { label:'Trip Management', icon:'🚚', items:[
    { to:'/tm',             label:'TM Dashboard' },
    { to:'/tm/booking',     label:'Trip Booking & Planning' },
    { to:'/tm/trip/new',    label:'New Trip Sheet' },
    { to:'/tm/trips',       label:'Trip History' },
  ]},
  { label:'Fleet & Compliance', icon:'🚗', items:[
    { to:'/tm/vehicles',    label:'Vehicle Master' },
    { to:'/tm/fuel',        label:'Fuel Log' },
    { to:'/tm/compliance',  label:'FC / Tax / Insurance' },
    { to:'/tm/drivers',     label:'Driver Register' },
  ]},
  { label:'Reports', icon:'📊', items:[
    { to:'/tm/fuel',        label:'Fuel Analysis' },
    { to:'/tm/trips',       label:'Trip Report' },
  ]},
]

export default function TMLayout() {
  return (
    <ModuleLayout moduleName="TM" navItems={NAV_ITEMS} sidebarGroups={SIDEBAR_GROUPS}>
      <Suspense fallback={<PageLoader text="Loading TM…" />}>
        <Routes>
          <Route index            element={<TMDashboard />} />
          <Route path="booking"   element={<TripBooking />} />
          <Route path="trips"     element={<TripBooking />} />
          <Route path="trip/new"  element={<TripSheet />} />
          <Route path="vehicles"  element={<VehicleMaster />} />
          <Route path="fuel"      element={<FuelLog />} />
          <Route path="*"         element={<Navigate to="/tm" replace />} />
        </Routes>
      </Suspense>
    </ModuleLayout>
  )
}
