import React, { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@context/AuthContext'
import { ThemeProvider } from '@context/ThemeContext'
import ProtectedRoute from '@components/layout/ProtectedRoute'
import ModuleRoute from '@components/layout/ModuleRoute'
import AppShell from '@components/layout/AppShell'
import PageLoader from '@components/ui/PageLoader'
import DemoGate from '@components/DemoGate'


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
const EduModule       = lazy(() => import('@modules/edu/pages/EduLayout'))
const TabletSupervisor= lazy(() => import('@modules/civil/pages/TabletHome'))
const VMModule        = lazy(() => import('@modules/vm/pages/VMLayout'))
const CNModule        = lazy(() => import('@modules/cn/pages/CNLayout'))
const ReportsModule   = lazy(() => import('@modules/reports/pages/ReportsLayout'))
const MDMModule       = lazy(() => import('@modules/mdm/pages/MDMLayout'))
const KPIModule       = lazy(() => import('@modules/kpi/pages/KPILayout'))
const PrintPreview    = lazy(() => import('@modules/print/pages/PrintPreview'))
const InvoicePrint    = lazy(() => import('@modules/sd/pages/InvoicePrint'))
const EWBPrint        = lazy(() => import('@modules/sd/pages/EWBPrint'))

const MR = ({ mod, el }) => <ModuleRoute moduleKey={mod}>{el}</ModuleRoute>

export default function App() {
  return (
    <DemoGate>
      <AuthProvider>
      <ThemeProvider>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* Protected — all inside AppShell */}
            <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
              <Route path="/home"      element={<HomeDashboard />} />
              <Route path="/sd/*"      element={<MR mod="sd"      el={<SDModule />} />} />
              <Route path="/mm/*"      element={<MR mod="mm"      el={<MMModule />} />} />
              <Route path="/pp/*"      element={<MR mod="pp"      el={<PPModule />} />} />
              <Route path="/fi/*"      element={<MR mod="fi"      el={<FIModule />} />} />
              <Route path="/qm/*"      element={<MR mod="qm"      el={<QMModule />} />} />
              <Route path="/pm/*"      element={<MR mod="pm"      el={<PMModule />} />} />
              <Route path="/hcm/*"     element={<MR mod="hcm"     el={<HCMModule />} />} />
              <Route path="/admin/*"   element={<MR mod="admin"   el={<AdminModule />} />} />
              <Route path="/wm/*"      element={<MR mod="wm"      el={<WMModule />} />} />
              <Route path="/crm/*"     element={<MR mod="crm"     el={<CRMModule />} />} />
              <Route path="/config/*"  element={<MR mod="config"  el={<ConfigModule />} />} />
              <Route path="/tm/*"      element={<MR mod="tm"      el={<TMModule />} />} />
              <Route path="/am/*"      element={<MR mod="am"      el={<AMModule />} />} />
              <Route path="/civil/*"   element={<MR mod="civil"   el={<CivilModule />} />} />
              <Route path="/edu/*"     element={<MR mod="edu"     el={<EduModule />} />} />
              <Route path="/vm/*"      element={<MR mod="vm"      el={<VMModule />} />} />
              <Route path="/cn/*"      element={<MR mod="cn"      el={<CNModule />} />} />
              <Route path="/reports/*" element={<MR mod="reports" el={<ReportsModule />} />} />
              <Route path="/mdm/*"     element={<MR mod="mdm"     el={<MDMModule />} />} />
              <Route path="/kpi/*"     element={<MR mod="kpi"     el={<KPIModule />} />} />
            </Route>

            {/* Tablet Supervisor View — full screen, outside AppShell */}
            <Route path="/civil/tablet" element={<ProtectedRoute><Suspense fallback={null}><TabletSupervisor /></Suspense></ProtectedRoute>} />

            {/* Print routes — outside AppShell (no sidebar/navbar) */}
            <Route path="/sd/invoices/:id/print" element={<ProtectedRoute><InvoicePrint /></ProtectedRoute>} />
            <Route path="/sd/ewaybill/:id/print" element={<ProtectedRoute><EWBPrint /></ProtectedRoute>} />

            {/* Fallback */}
            <Route path="/print/:type/:id" element={<PrintPreview />} />
            <Route path="/print/:type"     element={<PrintPreview />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Suspense>
      </ThemeProvider>
      </AuthProvider>
    </DemoGate>
  )
}
