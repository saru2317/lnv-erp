import React, { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@context/AuthContext'
import { ThemeProvider } from '@context/ThemeContext'
import ProtectedRoute from '@components/layout/ProtectedRoute'
import AppShell from '@components/layout/AppShell'
import PageLoader from '@components/ui/PageLoader'

// ── Eager loaded (always needed) ──
import LoginPage from '@modules/auth/pages/LoginPage'

// ── Lazy loaded (code-split per module) ──
const HomeDashboard   = lazy(() => import('@modules/home/pages/HomeDashboard'))
const SDModule        = lazy(() => import('@modules/sd/pages/SDLayout'))
const MMModule        = lazy(() => import('@modules/mm/pages/MMLayout'))
const PPModule        = lazy(() => import('@modules/pp/pages/PPLayout'))
const FIModule        = lazy(() => import('@modules/fi/pages/FILayout'))
const QMModule        = lazy(() => import('@modules/qm/pages/QMLayout'))
const PMModule        = lazy(() => import('@modules/pm/pages/PMLayout'))
const HCMModule       = lazy(() => import('@modules/hcm/pages/HCMLayout'))
const AdminModule     = lazy(() => import('@modules/admin/pages/AdminLayout'))
const WMModule        = lazy(() => import('@modules/wm/pages/WMLayout'))
const CRMModule       = lazy(() => import('@modules/crm/pages/CRMLayout'))
const ConfigModule    = lazy(() => import('@modules/config/pages/ConfigLayout'))
const TMModule        = lazy(() => import('@modules/tm/pages/TMLayout'))
const AMModule        = lazy(() => import('@modules/am/pages/AMLayout'))
const CivilModule     = lazy(() => import('@modules/civil/pages/CivilLayout'))
const VMModule        = lazy(() => import('@modules/vm/pages/VMLayout'))
const CNModule        = lazy(() => import('@modules/cn/pages/CNLayout'))
const ReportsModule   = lazy(() => import('@modules/reports/pages/ReportsLayout'))
const MDMModule       = lazy(() => import('@modules/mdm/pages/MDMLayout'))
const KPIModule       = lazy(() => import('@modules/kpi/pages/KPILayout'))
const PrintPreview    = lazy(() => import('@modules/print/pages/PrintPreview'))


export default function App() {
  return (
      <AuthProvider>
      <ThemeProvider>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* Protected — all inside AppShell */}
            <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
              <Route path="/home"       element={<HomeDashboard />} />
              <Route path="/sd/*"       element={<SDModule />} />
              <Route path="/mm/*"       element={<MMModule />} />
              <Route path="/pp/*"       element={<PPModule />} />
              <Route path="/fi/*"       element={<FIModule />} />
              <Route path="/qm/*"       element={<QMModule />} />
              <Route path="/pm/*"       element={<PMModule />} />
              <Route path="/hcm/*"      element={<HCMModule />} />
              <Route path="/admin/*"    element={<AdminModule />} />
              <Route path="/wm/*"       element={<WMModule />} />
              <Route path="/crm/*"      element={<CRMModule />} />
              <Route path="/config/*"   element={<ConfigModule />} />
              <Route path="/tm/*"       element={<TMModule />} />
              <Route path="/am/*"       element={<AMModule />} />
              <Route path="/civil/*"    element={<CivilModule />} />
              <Route path="/vm/*"       element={<VMModule />} />
              <Route path="/cn/*"       element={<CNModule />} />
              <Route path="/reports/*"  element={<ReportsModule />} />
              <Route path="/mdm/*"      element={<MDMModule />} />
              <Route path="/kpi/*"      element={<KPIModule />} />
            </Route>

            {/* Fallback */}
            <Route path="/print/:type/:id" element={<PrintPreview />} />
            <Route path="/print/:type"    element={<PrintPreview />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Suspense>
      </ThemeProvider>
    </AuthProvider>
  )
}
