import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import TopBar from './TopBar'
import ModuleNav from './ModuleNav'
import Sidebar from './Sidebar'

export default function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {/* ── Top Bar ── */}
      <TopBar onToggleSidebar={() => setSidebarCollapsed(p => !p)} />

      {/* ── Module Nav ── */}
      <ModuleNav />

      {/* ── Body ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar */}
        <Sidebar collapsed={sidebarCollapsed} />

        {/* Content Area */}
        <main style={{
          flex: 1, overflowY: 'auto',
          background: 'var(--bg-content)',
          padding: '16px 20px',
        }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
